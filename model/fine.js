const mongoose = require('mongoose');

const FineSchema = new mongoose.Schema({
    borrowRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BorrowRecord',
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['overdue', 'lost'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paid: {
        type: Boolean,
        default: false
    },
    paidAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // staff xác nhận thanh toán
    },
    note: String
});

module.exports = mongoose.model('Fine', FineSchema);
