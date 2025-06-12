const Bookshelf = require('../model/bookshelf');

exports.getAllBookshelves = async (req, res) => {
	try {
		const bookshelves = await Bookshelf.find().sort({ code: 1 });
		res.status(200).json(bookshelves);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getBookshelfById = async (req, res) => {
	try {
		const bookshelf = await Bookshelf.findById(req.params.id);
		if (!bookshelf) {
			return res.status(404).json({ message: 'Bookshelf not found' });
		}

		// Get books on this bookshelf
		const Book = require('../model/book');
		const books = await Book.find({ bookshelf: req.params.id })
			.populate('categories', 'name')
			.select('title author isbn image publishYear');

		res.status(200).json({
			...bookshelf.toObject(),
			books,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.createBookshelf = async (req, res) => {
	try {
		const { code, name, description, location } = req.body;

		// Check if bookshelf code already exists
		const existingBookshelf = await Bookshelf.findOne({ code });
		if (existingBookshelf) {
			return res.status(400).json({ message: 'Bookshelf code already exists' });
		}

		const bookshelf = await Bookshelf.create({
			code,
			name,
			description,
			location,
		});

		res.status(201).json({
			message: 'Bookshelf created successfully',
			bookshelf,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.updateBookshelf = async (req, res) => {
	try {
		const { code, name, description, location } = req.body;
		const bookshelfId = req.params.id;

		// Check if another bookshelf with the same code exists
		const existingBookshelf = await Bookshelf.findOne({
			code,
			_id: { $ne: bookshelfId },
		});
		if (existingBookshelf) {
			return res.status(400).json({ message: 'Bookshelf code already exists' });
		}

		const bookshelf = await Bookshelf.findByIdAndUpdate(
			bookshelfId,
			{ code, name, description, location, updatedAt: Date.now() },
			{ new: true }
		);

		if (!bookshelf) {
			return res.status(404).json({ message: 'Bookshelf not found' });
		}

		res.status(200).json({
			message: 'Bookshelf updated successfully',
			bookshelf,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.deleteBookshelf = async (req, res) => {
	try {
		const bookshelfId = req.params.id;

		// Check if bookshelf has any books
		const Book = require('../model/book');
		const booksOnShelf = await Book.countDocuments({ bookshelf: bookshelfId });

		if (booksOnShelf > 0) {
			return res.status(400).json({
				message: `Cannot delete bookshelf. It contains ${booksOnShelf} book(s)`,
			});
		}

		const bookshelf = await Bookshelf.findByIdAndDelete(bookshelfId);
		if (!bookshelf) {
			return res.status(404).json({ message: 'Bookshelf not found' });
		}

		res.status(200).json({
			message: 'Bookshelf deleted successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getBookshelfStats = async (req, res) => {
	try {
		const Book = require('../model/book');
		const Inventory = require('../model/Inventory');

		const bookshelves = await Bookshelf.find().sort({ code: 1 });
		const stats = [];

		for (const bookshelf of bookshelves) {
			// Get books on this bookshelf
			const books = await Book.find({ bookshelf: bookshelf._id });
			const bookIds = books.map((book) => book._id);

			// Get inventory stats for books on this bookshelf
			const inventoryStats = await Inventory.aggregate([
				{ $match: { book: { $in: bookIds } } },
				{
					$group: {
						_id: null,
						totalBooks: { $sum: '$total' },
						availableBooks: { $sum: '$available' },
						borrowedBooks: { $sum: '$borrowed' },
						damagedBooks: { $sum: '$damaged' },
						lostBooks: { $sum: '$lost' },
					},
				},
			]);

			const stat = inventoryStats[0] || {
				totalBooks: 0,
				availableBooks: 0,
				borrowedBooks: 0,
				damagedBooks: 0,
				lostBooks: 0,
			};

			stats.push({
				bookshelf: {
					_id: bookshelf._id,
					code: bookshelf.code,
					name: bookshelf.name,
					location: bookshelf.location,
				},
				bookTitles: books.length,
				...stat,
			});
		}

		res.status(200).json(stats);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.moveBooks = async (req, res) => {
	try {
		const { fromBookshelfId, toBookshelfId, bookIds } = req.body;

		// Validate bookshelves exist
		const fromBookshelf = await Bookshelf.findById(fromBookshelfId);
		const toBookshelf = await Bookshelf.findById(toBookshelfId);

		if (!fromBookshelf || !toBookshelf) {
			return res.status(404).json({ message: 'One or both bookshelves not found' });
		}

		// Update books' bookshelf
		const Book = require('../model/book');
		const result = await Book.updateMany(
			{
				_id: { $in: bookIds },
				bookshelf: fromBookshelfId,
			},
			{
				bookshelf: toBookshelfId,
				updatedAt: Date.now(),
			}
		);

		res.status(200).json({
			message: `Successfully moved ${result.modifiedCount} books from ${fromBookshelf.name} to ${toBookshelf.name}`,
			movedCount: result.modifiedCount,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
