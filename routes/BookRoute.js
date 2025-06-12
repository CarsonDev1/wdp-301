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
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *         bookshelf:
 *           type: string
 *           description: Bookshelf ID
 *         quantity:
 *           type: number
 *           description: Initial quantity for inventory
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
 *     Review:
 *       type: object
 *       required:
 *         - bookId
 *         - rating
 *       properties:
 *         bookId:
 *           type: string
 *           description: ID of the book to review
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5
 *         comment:
 *           type: string
 *           description: Review comment
 */

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/v1/books:
 *   get:
 *     summary: Get all books or search books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for title, author, ISBN, or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: bookshelf
 *         schema:
 *           type: string
 *         description: Filter by bookshelf ID
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author name
 *       - in: query
 *         name: publishYear
 *         schema:
 *           type: number
 *         description: Filter by publication year
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter only available books
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
 *         description: Number of books per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of books with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     totalRecords:
 *                       type: number
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.get('/', (req, res) => {
	// If search parameters are provided, use search function
	if (Object.keys(req.query).length > 0) {
		return BookController.searchBooks(req, res);
	}
	// Otherwise use getAllBooks
	return BookController.getAllBooks(req, res);
});

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

// ==================== ADMIN ONLY ROUTES ====================

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
 *       400:
 *         description: ISBN already exists
 *       403:
 *         description: Admin access required
 */
router.post('/', jwtConfig.requireAdmin, BookController.createBook);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   put:
 *     summary: Update book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       400:
 *         description: ISBN already exists for another book
 *       404:
 *         description: Book not found
 *       403:
 *         description: Admin access required
 */
router.put('/:id', jwtConfig.requireAdmin, BookController.updateBook);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   delete:
 *     summary: Delete book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       400:
 *         description: Cannot delete book with active borrow records
 *       404:
 *         description: Book not found
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', jwtConfig.requireAdmin, BookController.deleteBook);

/**
 * @swagger
 * /api/v1/books/{id}/inventory:
 *   put:
 *     summary: Update book inventory (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total:
 *                 type: number
 *                 description: Total number of books
 *               available:
 *                 type: number
 *                 description: Available books for borrowing
 *               borrowed:
 *                 type: number
 *                 description: Currently borrowed books
 *               damaged:
 *                 type: number
 *                 description: Damaged books
 *               lost:
 *                 type: number
 *                 description: Lost books
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       400:
 *         description: Invalid inventory numbers
 *       404:
 *         description: Book or inventory not found
 *       403:
 *         description: Admin access required
 */
router.put('/:id/inventory', jwtConfig.requireAdmin, BookController.updateBookInventory);

// ==================== USER AUTHENTICATED ROUTES ====================

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
 *     summary: Get user's borrowing history
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

// ==================== REVIEW ROUTES ====================

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
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: You can only review books you have borrowed and returned
 *       404:
 *         description: Book not found
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
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Review comment
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
