const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
    // Thông tin liên kết
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    fineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fine'
    },

    // Thời gian mượn - trả
    borrowDate: Date,
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: Date,
    updatedBrrowAt: Date, // log thời gia hạn mượn sách, chỉ lưu mốc thời gian mượn, không phải hạn trả sau khi gia hạn
    // Trạng thái và xử lý
    status: {
        type: String,
        enum: [
            'pending',    // chờ duyệt
            'declined',   // system từ chối
            'borrowed',   // đã mượn
            'returned',   // đã trả
            'overdue',    // quá hạn
            'lost'        // làm mất
        ],
        default: 'pending'
    },
    isReadOnSite: {
        type: Boolean,
        default: false
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Ghi chú và metadata
    notes: String,
    createdRequestAt: { // thời gian bắt đầu request mượn, status 'pending'
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);
