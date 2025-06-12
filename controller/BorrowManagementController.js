const BorrowRecord = require('../model/borrowHistory');
const Book = require('../model/book');
const User = require('../model/user');
const Inventory = require('../model/Inventory');
const Fine = require('../model/fine');

exports.getAllBorrowRequests = async (req, res) => {
	try {
		const { page = 1, limit = 10, status, userId, bookId, isOverdue } = req.query;

		// Build query
		const query = {};
		if (status) query.status = status;
		if (userId) query.userId = userId;
		if (bookId) query.bookId = bookId;

		// Filter overdue books
		if (isOverdue === 'true') {
			query.status = 'borrowed';
			query.dueDate = { $lt: new Date() };
		}

		const borrowRequests = await BorrowRecord.find(query)
			.populate('userId', 'name studentId email phone')
			.populate('bookId', 'title author isbn image')
			.populate('processedBy', 'name studentId')
			.populate('fineId')
			.sort({ createdRequestAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await BorrowRecord.countDocuments(query);

		res.status(200).json({
			borrowRequests,
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

exports.approveBorrowRequest = async (req, res) => {
	try {
		const requestId = req.params.id;
		const staffId = req.user.id;

		const borrowRequest = await BorrowRecord.findById(requestId)
			.populate('userId', 'name studentId')
			.populate('bookId', 'title author isbn');

		if (!borrowRequest) {
			return res.status(404).json({ message: 'Borrow request not found' });
		}

		if (borrowRequest.status !== 'pending') {
			return res.status(400).json({
				message: 'Only pending requests can be approved',
			});
		}

		// Check inventory availability
		const inventory = await Inventory.findOne({ book: borrowRequest.bookId._id });
		if (!inventory || inventory.available <= 0) {
			return res.status(400).json({
				message: 'Book is not available for borrowing',
			});
		}

		// Update borrow request
		borrowRequest.status = 'borrowed';
		borrowRequest.borrowDate = new Date();
		borrowRequest.processedBy = staffId;
		await borrowRequest.save();

		// Update inventory
		inventory.available -= 1;
		inventory.borrowed += 1;
		await inventory.save();

		res.status(200).json({
			message: 'Borrow request approved successfully',
			borrowRequest,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.declineBorrowRequest = async (req, res) => {
	try {
		const requestId = req.params.id;
		const staffId = req.user.id;
		const { reason } = req.body;

		const borrowRequest = await BorrowRecord.findById(requestId);

		if (!borrowRequest) {
			return res.status(404).json({ message: 'Borrow request not found' });
		}

		if (borrowRequest.status !== 'pending') {
			return res.status(400).json({
				message: 'Only pending requests can be declined',
			});
		}

		borrowRequest.status = 'declined';
		borrowRequest.processedBy = staffId;
		if (reason) borrowRequest.notes = reason;
		await borrowRequest.save();

		res.status(200).json({
			message: 'Borrow request declined successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.returnBook = async (req, res) => {
	try {
		const requestId = req.params.id;
		const staffId = req.user.id;
		const { condition = 'good', notes } = req.body; // good, damaged, lost

		const borrowRequest = await BorrowRecord.findById(requestId)
			.populate('userId', 'name studentId')
			.populate('bookId', 'title author isbn price');

		if (!borrowRequest) {
			return res.status(404).json({ message: 'Borrow record not found' });
		}

		if (borrowRequest.status !== 'borrowed') {
			return res.status(400).json({
				message: 'Only borrowed books can be returned',
			});
		}

		const returnDate = new Date();
		const isOverdue = returnDate > borrowRequest.dueDate;

		// Update borrow record
		borrowRequest.status = condition === 'lost' ? 'lost' : 'returned';
		borrowRequest.returnDate = returnDate;
		borrowRequest.processedBy = staffId;
		if (notes) borrowRequest.notes = notes;
		await borrowRequest.save();

		// Update inventory
		const inventory = await Inventory.findOne({ book: borrowRequest.bookId._id });
		if (inventory) {
			inventory.borrowed -= 1;

			switch (condition) {
				case 'good':
					inventory.available += 1;
					break;
				case 'damaged':
					inventory.damaged += 1;
					break;
				case 'lost':
					inventory.lost += 1;
					break;
			}
			await inventory.save();
		}

		// Create fine if needed
		let fine = null;
		if (isOverdue || condition === 'damaged' || condition === 'lost') {
			let fineAmount = 0;
			let fineReason = '';

			if (isOverdue) {
				const daysLate = Math.ceil((returnDate - borrowRequest.dueDate) / (1000 * 60 * 60 * 24));
				fineAmount += daysLate * 5000; // 5000 VND per day
				fineReason = 'overdue';
			}

			if (condition === 'damaged') {
				fineAmount += borrowRequest.bookId.price * 0.3; // 30% of book price
				fineReason = fineReason ? 'overdue,damaged' : 'damaged';
			}

			if (condition === 'lost') {
				fineAmount += borrowRequest.bookId.price; // Full book price
				fineReason = 'lost';
			}

			if (fineAmount > 0) {
				fine = await Fine.create({
					borrowRecord: borrowRequest._id,
					user: borrowRequest.userId._id,
					reason: fineReason.split(',')[0], // Use primary reason
					amount: fineAmount,
					processedBy: staffId,
					note: `${condition === 'lost' ? 'Book lost' : condition === 'damaged' ? 'Book damaged' : ''} ${
						isOverdue
							? `Late return: ${Math.ceil(
									(returnDate - borrowRequest.dueDate) / (1000 * 60 * 60 * 24)
							  )} days`
							: ''
					}`.trim(),
				});

				borrowRequest.fineId = fine._id;
				await borrowRequest.save();
			}
		}

		res.status(200).json({
			message: 'Book returned successfully',
			borrowRequest,
			fine: fine || null,
			isOverdue,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.extendBorrowPeriod = async (req, res) => {
	try {
		const requestId = req.params.id;
		const staffId = req.user.id;
		const { days = 7 } = req.body;

		const borrowRequest = await BorrowRecord.findById(requestId)
			.populate('userId', 'name studentId')
			.populate('bookId', 'title author');

		if (!borrowRequest) {
			return res.status(404).json({ message: 'Borrow record not found' });
		}

		if (borrowRequest.status !== 'borrowed') {
			return res.status(400).json({
				message: 'Only currently borrowed books can be extended',
			});
		}

		// Check if user has any outstanding fines
		const outstandingFines = await Fine.countDocuments({
			user: borrowRequest.userId._id,
			paid: false,
		});

		if (outstandingFines > 0) {
			return res.status(400).json({
				message: 'Cannot extend borrow period. User has outstanding fines',
			});
		}

		// Extend due date
		const newDueDate = new Date(borrowRequest.dueDate);
		newDueDate.setDate(newDueDate.getDate() + parseInt(days));

		borrowRequest.dueDate = newDueDate;
		borrowRequest.updatedBrrowAt = new Date();
		await borrowRequest.save();

		res.status(200).json({
			message: `Borrow period extended by ${days} days`,
			borrowRequest,
			newDueDate,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getBorrowStatistics = async (req, res) => {
	try {
		const { fromDate, toDate } = req.query;

		const dateFilter = {};
		if (fromDate) dateFilter.$gte = new Date(fromDate);
		if (toDate) dateFilter.$lte = new Date(toDate);

		const matchFilter = {};
		if (Object.keys(dateFilter).length > 0) {
			matchFilter.createdRequestAt = dateFilter;
		}

		// Get basic statistics
		const stats = await BorrowRecord.aggregate([
			{ $match: matchFilter },
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
				},
			},
		]);

		// Get overdue books
		const overdueBooks = await BorrowRecord.find({
			status: 'borrowed',
			dueDate: { $lt: new Date() },
		})
			.populate('userId', 'name studentId')
			.populate('bookId', 'title author')
			.select('userId bookId dueDate');

		// Get most borrowed books
		const topBorrowedBooks = await BorrowRecord.aggregate([
			{ $match: { ...matchFilter, status: { $in: ['borrowed', 'returned'] } } },
			{
				$group: {
					_id: '$bookId',
					borrowCount: { $sum: 1 },
				},
			},
			{ $sort: { borrowCount: -1 } },
			{ $limit: 10 },
			{
				$lookup: {
					from: 'books',
					localField: '_id',
					foreignField: '_id',
					as: 'book',
				},
			},
			{ $unwind: '$book' },
		]);

		// Get most active borrowers
		const topBorrowers = await BorrowRecord.aggregate([
			{ $match: { ...matchFilter, status: { $in: ['borrowed', 'returned'] } } },
			{
				$group: {
					_id: '$userId',
					borrowCount: { $sum: 1 },
				},
			},
			{ $sort: { borrowCount: -1 } },
			{ $limit: 10 },
			{
				$lookup: {
					from: 'users',
					localField: '_id',
					foreignField: '_id',
					as: 'user',
				},
			},
			{ $unwind: '$user' },
		]);

		const result = {
			summary: stats.reduce((acc, stat) => {
				acc[stat._id] = stat.count;
				return acc;
			}, {}),
			overdueBooks: overdueBooks.map((record) => ({
				user: record.userId,
				book: record.bookId,
				dueDate: record.dueDate,
				daysLate: Math.ceil((new Date() - record.dueDate) / (1000 * 60 * 60 * 24)),
			})),
			topBorrowedBooks: topBorrowedBooks.map((item) => ({
				book: item.book,
				borrowCount: item.borrowCount,
			})),
			topBorrowers: topBorrowers.map((item) => ({
				user: {
					_id: item.user._id,
					name: item.user.name,
					studentId: item.user.studentId,
				},
				borrowCount: item.borrowCount,
			})),
		};

		res.status(200).json(result);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
