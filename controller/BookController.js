const Book = require('../model/book');
const Inventory = require('../model/Inventory');
const BorrowRecord = require('../model/borrowHistory');
const Review = require('../model/review');

exports.getAllBooks = async (req, res) => {
	try {
		const books = await Book.find().populate('categories', 'name').populate('bookshelf', 'code name location');
		res.status(200).json(books);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getBookById = async (req, res) => {
	try {
		const book = await Book.findById(req.params.id)
			.populate('categories', 'name')
			.populate('bookshelf', 'code name location');

		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		// Get inventory information
		const inventory = await Inventory.findOne({ book: req.params.id });

		// Get reviews for this book
		const reviews = await Review.find({ bookId: req.params.id })
			.populate('userId', 'name studentId')
			.sort({ createdAt: -1 });

		// Calculate average rating
		const avgRating =
			reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

		const bookDetails = {
			...book.toObject(),
			inventory: inventory || { available: 0, total: 0, borrowed: 0 },
			reviews,
			averageRating: Math.round(avgRating * 10) / 10,
			totalReviews: reviews.length,
		};

		res.status(200).json(bookDetails);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.createBook = async (req, res) => {
	try {
		const book = await Book.create(req.body);

		// Create inventory record for the new book
		await Inventory.create({
			book: book._id,
			total: req.body.quantity || 0,
			available: req.body.quantity || 0,
			borrowed: 0,
			damaged: 0,
			lost: 0,
		});

		res.status(201).json(book);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.createBorrowRequest = async (req, res) => {
	try {
		const { bookId, isReadOnSite, notes } = req.body;
		const userId = req.user.id;

		// Check if book exists
		const book = await Book.findById(bookId);
		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		// Check inventory availability
		const inventory = await Inventory.findOne({ book: bookId });
		if (!inventory || inventory.available <= 0) {
			return res.status(400).json({ message: 'Book is not available for borrowing' });
		}

		// Check if user already has a pending or active borrow request for this book
		const existingRequest = await BorrowRecord.findOne({
			userId,
			bookId,
			status: { $in: ['pending', 'borrowed'] },
		});

		if (existingRequest) {
			return res.status(400).json({
				message: 'You already have a pending or active borrow request for this book',
			});
		}

		// Create borrow request
		const dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + (isReadOnSite ? 1 : 14)); // 1 day for on-site, 14 days for take-home

		const borrowRequest = await BorrowRecord.create({
			userId,
			bookId,
			dueDate,
			isReadOnSite,
			notes,
			status: 'pending',
		});

		await borrowRequest.populate(['userId', 'bookId']);

		res.status(201).json({
			message: 'Borrow request created successfully',
			borrowRequest,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.cancelBorrowRequest = async (req, res) => {
	try {
		const requestId = req.params.id;
		const userId = req.user.id;

		// Find the borrow request
		const borrowRequest = await BorrowRecord.findById(requestId);

		if (!borrowRequest) {
			return res.status(404).json({ message: 'Borrow request not found' });
		}

		// Check if the request belongs to the current user
		if (borrowRequest.userId.toString() !== userId) {
			return res.status(403).json({ message: 'You can only cancel your own requests' });
		}

		// Check if the request can be cancelled (only pending requests)
		if (borrowRequest.status !== 'pending') {
			return res.status(400).json({
				message: 'Only pending requests can be cancelled',
			});
		}

		// Update status to declined
		borrowRequest.status = 'declined';
		await borrowRequest.save();

		res.status(200).json({
			message: 'Borrow request cancelled successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getBorrowHistory = async (req, res) => {
	try {
		const userId = req.user.id;
		const { page = 1, limit = 10, status } = req.query;

		// Build query
		const query = { userId };
		if (status) {
			query.status = status;
		}

		// Get borrow history with pagination
		const borrowHistory = await BorrowRecord.find(query)
			.populate('bookId', 'title author isbn image')
			.populate('processedBy', 'name')
			.populate('fineId')
			.sort({ createdRequestAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		// Get total count for pagination
		const total = await BorrowRecord.countDocuments(query);

		// Get user's reviews
		const reviews = await Review.find({ userId }).populate('bookId', 'title author').sort({ createdAt: -1 });

		res.status(200).json({
			borrowHistory,
			reviews,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(total / limit),
				totalRecords: total,
				hasNext: page * limit < total,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getUserBorrowRequests = async (req, res) => {
	try {
		const userId = req.user.id;

		const requests = await BorrowRecord.find({ userId })
			.populate('bookId', 'title author isbn image')
			.populate('processedBy', 'name')
			.sort({ createdRequestAt: -1 });

		res.status(200).json(requests);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.createReview = async (req, res) => {
	try {
		const { bookId, rating, comment } = req.body;
		const userId = req.user.id;

		// Check if book exists
		const book = await Book.findById(bookId);
		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		// Check if user has borrowed and returned this book
		const borrowRecord = await BorrowRecord.findOne({
			userId,
			bookId,
			status: 'returned',
		});

		if (!borrowRecord) {
			return res.status(400).json({
				message: 'You can only review books you have borrowed and returned',
			});
		}

		// Check if user has already reviewed this book
		const existingReview = await Review.findOne({ userId, bookId });
		if (existingReview) {
			return res.status(400).json({
				message: 'You have already reviewed this book',
			});
		}

		// Create review
		const review = await Review.create({
			userId,
			bookId,
			rating,
			comment,
		});

		await review.populate('userId', 'name studentId');

		res.status(201).json({
			message: 'Review created successfully',
			review,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.updateReview = async (req, res) => {
	try {
		const reviewId = req.params.id;
		const { rating, comment } = req.body;
		const userId = req.user.id;

		// Find and update review
		const review = await Review.findOneAndUpdate(
			{ _id: reviewId, userId },
			{ rating, comment },
			{ new: true }
		).populate('userId', 'name studentId');

		if (!review) {
			return res.status(404).json({
				message: "Review not found or you don't have permission to update it",
			});
		}

		res.status(200).json({
			message: 'Review updated successfully',
			review,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.deleteReview = async (req, res) => {
	try {
		const reviewId = req.params.id;
		const userId = req.user.id;

		// Find and delete review
		const review = await Review.findOneAndDelete({ _id: reviewId, userId });

		if (!review) {
			return res.status(404).json({
				message: "Review not found or you don't have permission to delete it",
			});
		}

		res.status(200).json({
			message: 'Review deleted successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.updateBook = async (req, res) => {
	try {
		const bookId = req.params.id;
		const {
			title,
			isbn,
			author,
			publisher,
			publishYear,
			description,
			price,
			image,
			categories,
			bookshelf,
			quantity,
		} = req.body;

		// Check if another book with the same ISBN exists
		const existingBook = await Book.findOne({
			isbn,
			_id: { $ne: bookId },
		});
		if (existingBook) {
			return res.status(400).json({ message: 'ISBN already exists for another book' });
		}

		const book = await Book.findByIdAndUpdate(
			bookId,
			{
				title,
				isbn,
				author,
				publisher,
				publishYear,
				description,
				price,
				image,
				categories,
				bookshelf,
				updatedAt: Date.now(),
			},
			{ new: true }
		)
			.populate('categories', 'name')
			.populate('bookshelf', 'code name location');

		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		// Update inventory if quantity is provided
		if (quantity !== undefined) {
			const inventory = await Inventory.findOne({ book: bookId });
			if (inventory) {
				const difference = quantity - inventory.total;
				inventory.total = quantity;
				inventory.available = inventory.available + difference;
				await inventory.save();
			}
		}

		res.status(200).json({
			message: 'Book updated successfully',
			book,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.deleteBook = async (req, res) => {
	try {
		const bookId = req.params.id;

		// Check if book has any borrow records
		const borrowRecords = await BorrowRecord.countDocuments({
			bookId,
			status: { $in: ['pending', 'borrowed'] },
		});

		if (borrowRecords > 0) {
			return res.status(400).json({
				message: `Cannot delete book. It has ${borrowRecords} active borrow record(s)`,
			});
		}

		// Delete inventory first
		await Inventory.findOneAndDelete({ book: bookId });

		// Delete the book
		const book = await Book.findByIdAndDelete(bookId);
		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		res.status(200).json({
			message: 'Book deleted successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.updateBookInventory = async (req, res) => {
	try {
		const bookId = req.params.id;
		const { total, available, borrowed, damaged, lost } = req.body;

		const book = await Book.findById(bookId);
		if (!book) {
			return res.status(404).json({ message: 'Book not found' });
		}

		const inventory = await Inventory.findOne({ book: bookId });
		if (!inventory) {
			return res.status(404).json({ message: 'Inventory not found for this book' });
		}

		// Validate the numbers make sense
		const newTotal = total !== undefined ? total : inventory.total;
		const newAvailable = available !== undefined ? available : inventory.available;
		const newBorrowed = borrowed !== undefined ? borrowed : inventory.borrowed;
		const newDamaged = damaged !== undefined ? damaged : inventory.damaged;
		const newLost = lost !== undefined ? lost : inventory.lost;

		if (newAvailable + newBorrowed + newDamaged + newLost !== newTotal) {
			return res.status(400).json({
				message: 'Invalid inventory numbers. Total must equal available + borrowed + damaged + lost',
			});
		}

		// Update inventory
		Object.assign(inventory, {
			total: newTotal,
			available: newAvailable,
			borrowed: newBorrowed,
			damaged: newDamaged,
			lost: newLost,
		});

		await inventory.save();

		res.status(200).json({
			message: 'Book inventory updated successfully',
			inventory,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.searchBooks = async (req, res) => {
	try {
		const {
			query,
			category,
			bookshelf,
			author,
			publishYear,
			available,
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

		// Build search query
		const searchQuery = {};

		if (query) {
			searchQuery.$or = [
				{ title: { $regex: query, $options: 'i' } },
				{ author: { $regex: query, $options: 'i' } },
				{ isbn: { $regex: query, $options: 'i' } },
				{ description: { $regex: query, $options: 'i' } },
			];
		}

		if (category) {
			searchQuery.categories = category;
		}

		if (bookshelf) {
			searchQuery.bookshelf = bookshelf;
		}

		if (author) {
			searchQuery.author = { $regex: author, $options: 'i' };
		}

		if (publishYear) {
			searchQuery.publishYear = publishYear;
		}

		// Get books
		let booksQuery = Book.find(searchQuery)
			.populate('categories', 'name')
			.populate('bookshelf', 'code name location')
			.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		let books = await booksQuery;

		// Filter by availability if requested
		if (available === 'true') {
			const bookIds = books.map((book) => book._id);
			const availableInventory = await Inventory.find({
				book: { $in: bookIds },
				available: { $gt: 0 },
			}).select('book');

			const availableBookIds = availableInventory.map((inv) => inv.book.toString());
			books = books.filter((book) => availableBookIds.includes(book._id.toString()));
		}

		// Get inventory information for each book
		const booksWithInventory = await Promise.all(
			books.map(async (book) => {
				const inventory = await Inventory.findOne({ book: book._id });
				return {
					...book.toObject(),
					inventory: inventory || { available: 0, total: 0, borrowed: 0, damaged: 0, lost: 0 },
				};
			})
		);

		const total = await Book.countDocuments(searchQuery);

		res.status(200).json({
			books: booksWithInventory,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(total / limit),
				totalRecords: total,
				hasNext: page * limit < total,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
