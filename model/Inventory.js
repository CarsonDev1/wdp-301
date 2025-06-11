const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
        unique: true // mỗi phiên bản sách chỉ có 1 bản ghi inventory
    },

    total: { type: Number, default: 0 },       // Tổng số sách nhập
    available: { type: Number, default: 0 },   // Có thể mượn
    borrowed: { type: Number, default: 0 },    // Đang được mượn
    damaged: { type: Number, default: 0 },     // Không dùng được
    lost: { type: Number, default: 0 },        // Bị mất

    lastUpdated: { type: Date, default: Date.now }
});

inventorySchema.pre('save', function (next) {
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
