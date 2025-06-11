const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportDate: { type: Date, default: Date.now },

    // Khoảng thời gian thống kê
    periodType: { type: String, enum: ['day', 'week', 'month'], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },

    // Tổng quan mượn/trả
    totalBorrowed: { type: Number, default: 0 },
    totalReturned: { type: Number, default: 0 },

    // Top sách được mượn nhiều nhất
    topBorrowedBooks: [{
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
        borrowCount: Number
    }],

    // Người dùng mượn nhiều nhất
    topBorrowers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        totalBorrowed: Number
    }],

    // Sách trễ hạn chưa trả
    lateBooks: [{
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        dueDate: Date,
        daysLate: Number
    }],

    // Thống kê theo thể loại
    categoryStats: [{
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        totalBooks: Number,
        availableBooks: Number,
        borrowedBooks: Number,
        damagedBooks: Number,
        lostBooks: Number
    }],

    // Người tạo báo cáo (tuỳ chọn)
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Report', reportSchema);