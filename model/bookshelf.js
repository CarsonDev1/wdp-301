const mongoose = require('mongoose');

const bookshelfSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },  // mã kệ sách, ví dụ "K-01"
    name: { type: String, required: true },                // tên kệ, ví dụ "Kệ Toán học"
    description: String,                                   // mô tả thêm
    location: String,                                      // vị trí phòng, tầng, khu vực
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

bookshelfSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Bookshelf', bookshelfSchema);
