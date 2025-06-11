const express = require('express');
const router = express.Router();
const BookController = require('../controller/BookController');
const jwtConfig = require('../config/jwtconfig');

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - isbn
 *       properties:
 *         title:
 *           type: string
 *           description: Book title
 *         isbn:
 *           type: string
 *           description: Unique ISBN number
 *         author:
 *           type: string
 *           description: Book author
 *         publisher:
 *           type: string
 *           description: Book publisher
 *         publishYear:
 *           type: number
 *           description: Publication year
 *         description:
 *           type: string
 *           description: Book description
 *         price:
 *           type: number
 *           description: Book price
 *         image:
 *           type: string
 *           description: Book cover image URL
 *     BorrowRequest:
 *       type: object
 *       required:
 *         - bookId
 *       properties:
 *         bookId:
 *           type: string
 *           description: ID of the book to borrow
 *         isReadOnSite:
 *           type: boolean
 *           description: Whether to read on-site or take home
 *         notes:
 *           type: string
 *           description: Additional notes for the request
 */

/**
 * @swagger
 * /api/v1/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of all books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get('/', BookController.getAllBooks);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   get:
 *     summary: Get book details by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book details with inventory and reviews
 *       404:
 *         description: Book not found
 */
router.get('/:id', BookController.getBookById);

/**
 * @swagger
 * /api/v1/books:
 *   post:
 *     summary: Create a new book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Book created successfully
 *       403:
 *         description: Admin access required
 */
router.post('/', jwtConfig.requireAdmin, BookController.createBook);

/**
 * @swagger
 * /api/v1/books/borrow/request:
 *   post:
 *     summary: Create a book borrow request
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowRequest'
 *     responses:
 *       201:
 *         description: Borrow request created successfully
 *       400:
 *         description: Book not available or user already has pending request
 *       404:
 *         description: Book not found
 */
router.post('/borrow/request', jwtConfig.requireAuth, BookController.createBorrowRequest);

/**
 * @swagger
 * /api/v1/books/borrow/cancel/{id}:
 *   delete:
 *     summary: Cancel a borrow request
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Borrow request ID
 *     responses:
 *       200:
 *         description: Borrow request cancelled successfully
 *       400:
 *         description: Only pending requests can be cancelled
 *       403:
 *         description: You can only cancel your own requests
 *       404:
 *         description: Borrow request not found
 */
router.delete('/borrow/cancel/:id', jwtConfig.requireAuth, BookController.cancelBorrowRequest);

/**
 * @swagger
 * /api/v1/books/borrow/requests:
 *   get:
 *     summary: Get user's borrow requests
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's borrow requests
 */
router.get('/borrow/requests', jwtConfig.requireAuth, BookController.getUserBorrowRequests);

/**
 * @swagger
 * /api/v1/books/history/user:
 *   get:
 *     summary: Get user's borrowing and returning history
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, declined, borrowed, returned, overdue, lost]
 *         description: Filter by borrow status
 *     responses:
 *       200:
 *         description: User's borrow history and reviews
 */
router.get('/history/user', jwtConfig.requireAuth, BookController.getBorrowHistory);

/**
 * @swagger
 * /api/v1/books/review:
 *   post:
 *     summary: Create a book review
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - rating
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: ID of the book to review
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: You can only review books you have borrowed and returned
 */
router.post('/review', jwtConfig.requireAuth, BookController.createReview);

/**
 * @swagger
 * /api/v1/books/review/{id}:
 *   put:
 *     summary: Update a book review
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found or permission denied
 */
router.put('/review/:id', jwtConfig.requireAuth, BookController.updateReview);

/**
 * @swagger
 * /api/v1/books/review/{id}:
 *   delete:
 *     summary: Delete a book review
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found or permission denied
 */
router.delete('/review/:id', jwtConfig.requireAuth, BookController.deleteReview);

module.exports = router;
