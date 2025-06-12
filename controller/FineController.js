const Fine = require('../model/fine');
const BorrowRecord = require('../model/borrowHistory');

exports.getAllFines = async (req, res) => {
	try {
		const { page = 1, limit = 10, paid, userId, reason } = req.query;

		// Build query
		const query = {};
		if (paid !== undefined) query.paid = paid === 'true';
		if (userId) query.user = userId;
		if (reason) query.reason = reason;

		const fines = await Fine.find(query)
			.populate('user', 'name studentId email phone')
			.populate('borrowRecord')
			.populate({
				path: 'borrowRecord',
				populate: {
					path: 'bookId',
					select: 'title author isbn image',
				},
			})
			.populate('processedBy', 'name studentId')
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Fine.countDocuments(query);

		// Calculate total unpaid amount
		const unpaidTotal = await Fine.aggregate([
			{ $match: { paid: false } },
			{
				$group: {
					_id: null,
					totalAmount: { $sum: '$amount' },
				},
			},
		]);

		res.status(200).json({
			fines,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(total / limit),
				totalRecords: total,
				hasNext: page * limit < total,
				hasPrev: page > 1,
			},
			summary: {
				totalUnpaidAmount: unpaidTotal[0]?.totalAmount || 0,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getFineById = async (req, res) => {
	try {
		const fine = await Fine.findById(req.params.id)
			.populate('user', 'name studentId email phone address')
			.populate('borrowRecord')
			.populate({
				path: 'borrowRecord',
				populate: {
					path: 'bookId',
					select: 'title author isbn image price',
				},
			})
			.populate('processedBy', 'name studentId');

		if (!fine) {
			return res.status(404).json({ message: 'Fine not found' });
		}

		res.status(200).json(fine);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getUserFines = async (req, res) => {
	try {
		const userId = req.user.id;
		const { paid } = req.query;

		const query = { user: userId };
		if (paid !== undefined) query.paid = paid === 'true';

		const fines = await Fine.find(query)
			.populate('borrowRecord')
			.populate({
				path: 'borrowRecord',
				populate: {
					path: 'bookId',
					select: 'title author isbn image',
				},
			})
			.sort({ createdAt: -1 });

		// Calculate total unpaid amount for this user
		const unpaidTotal = await Fine.aggregate([
			{ $match: { user: userId, paid: false } },
			{
				$group: {
					_id: null,
					totalAmount: { $sum: '$amount' },
				},
			},
		]);

		res.status(200).json({
			fines,
			totalUnpaidAmount: unpaidTotal[0]?.totalAmount || 0,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.markFineAsPaid = async (req, res) => {
	try {
		const fineId = req.params.id;
		const staffId = req.user.id;
		const { paymentMethod, note } = req.body;

		const fine = await Fine.findById(fineId)
			.populate('user', 'name studentId')
			.populate('borrowRecord')
			.populate({
				path: 'borrowRecord',
				populate: {
					path: 'bookId',
					select: 'title author isbn',
				},
			});

		if (!fine) {
			return res.status(404).json({ message: 'Fine not found' });
		}

		if (fine.paid) {
			return res.status(400).json({ message: 'Fine is already paid' });
		}

		fine.paid = true;
		fine.paidAt = new Date();
		fine.processedBy = staffId;
		if (note) fine.note = note;
		await fine.save();

		res.status(200).json({
			message: 'Fine marked as paid successfully',
			fine,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.createManualFine = async (req, res) => {
	try {
		const { userId, borrowRecordId, reason, amount, note } = req.body;
		const staffId = req.user.id;

		// Validate user exists
		const User = require('../model/user');
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Validate borrow record if provided
		let borrowRecord = null;
		if (borrowRecordId) {
			borrowRecord = await BorrowRecord.findById(borrowRecordId);
			if (!borrowRecord) {
				return res.status(404).json({ message: 'Borrow record not found' });
			}
		}

		const fine = await Fine.create({
			user: userId,
			borrowRecord: borrowRecordId,
			reason,
			amount,
			note,
			processedBy: staffId,
		});

		await fine.populate([
			{ path: 'user', select: 'name studentId' },
			{ path: 'borrowRecord' },
			{ path: 'processedBy', select: 'name studentId' },
		]);

		res.status(201).json({
			message: 'Manual fine created successfully',
			fine,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.deleteFine = async (req, res) => {
	try {
		const fineId = req.params.id;

		const fine = await Fine.findById(fineId);
		if (!fine) {
			return res.status(404).json({ message: 'Fine not found' });
		}

		if (fine.paid) {
			return res.status(400).json({
				message: 'Cannot delete a paid fine',
			});
		}

		await Fine.findByIdAndDelete(fineId);

		res.status(200).json({
			message: 'Fine deleted successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getFineStatistics = async (req, res) => {
	try {
		const { fromDate, toDate } = req.query;

		const dateFilter = {};
		if (fromDate) dateFilter.$gte = new Date(fromDate);
		if (toDate) dateFilter.$lte = new Date(toDate);

		const matchFilter = {};
		if (Object.keys(dateFilter).length > 0) {
			matchFilter.createdAt = dateFilter;
		}

		// Get fine statistics
		const stats = await Fine.aggregate([
			{ $match: matchFilter },
			{
				$group: {
					_id: {
						reason: '$reason',
						paid: '$paid',
					},
					count: { $sum: 1 },
					totalAmount: { $sum: '$amount' },
				},
			},
		]);

		// Get monthly trend
		const monthlyTrend = await Fine.aggregate([
			{ $match: matchFilter },
			{
				$group: {
					_id: {
						year: { $year: '$createdAt' },
						month: { $month: '$createdAt' },
					},
					totalFines: { $sum: 1 },
					totalAmount: { $sum: '$amount' },
					paidAmount: {
						$sum: {
							$cond: ['$paid', '$amount', 0],
						},
					},
				},
			},
			{ $sort: { '_id.year': 1, '_id.month': 1 } },
		]);

		// Get top users with most fines
		const topFineUsers = await Fine.aggregate([
			{ $match: matchFilter },
			{
				$group: {
					_id: '$user',
					totalFines: { $sum: 1 },
					totalAmount: { $sum: '$amount' },
					unpaidAmount: {
						$sum: {
							$cond: ['$paid', 0, '$amount'],
						},
					},
				},
			},
			{ $sort: { totalAmount: -1 } },
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

		res.status(200).json({
			summary: stats,
			monthlyTrend,
			topFineUsers: topFineUsers.map((item) => ({
				user: {
					_id: item.user._id,
					name: item.user.name,
					studentId: item.user.studentId,
				},
				totalFines: item.totalFines,
				totalAmount: item.totalAmount,
				unpaidAmount: item.unpaidAmount,
			})),
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
