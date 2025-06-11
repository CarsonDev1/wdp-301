const express = require('express');
const router = express.Router();
const BookController = require('../controller/BookController');
const jwtConfig = require('../config/jwtconfig');

// Lấy tất cả sách
router.get('/', BookController.getAllBooks);

// Lấy chi tiết 1 cuốn sách
router.get('/:id', BookController.getBookById);

// Thêm sách mới (chỉ admin)
router.post('/', jwtConfig.requireAdmin, BookController.createBook);

// Gửi yêu cầu mượn sách (người dùng đã đăng nhập)
router.post('/borrow/request', jwtConfig.requireAuth, BookController.createBorrowRequest);

// Hủy yêu cầu mượn sách (người dùng đã đăng nhập)
router.delete('/borrow/cancel/:id', jwtConfig.requireAuth, BookController.cancelBorrowRequest);

// Lịch sử mượn-trả và đánh giá (người dùng đã đăng nhập)
router.get('/history/user', jwtConfig.requireAuth, BookController.getBorrowHistory);

module.exports = router;
