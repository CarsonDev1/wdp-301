const express = require('express');
const router = express.Router();
const BookshelfController = require('../controller/BookshelfController');
const jwtConfig = require('../config/jwtconfig');

/**
 * @swagger
 * components:
 *   schemas:
 *     Bookshelf:
 *       type: object
 *       required:
 *         - code
 *         - name
 *       properties:
 *         code:
 *           type: string
 *           description: Unique bookshelf code (e.g., K-01)
 *         name:
 *           type: string
 *           description: Bookshelf name
 *         description:
 *           type: string
 *           description: Bookshelf description
 *         location:
 *           type: string
 *           description: Physical location of the bookshelf
 */

/**
 * @swagger
 * /api/v1/bookshelves:
 *   get:
 *     summary: Get all bookshelves
 *     tags: [Bookshelves]
 *     responses:
 *       200:
 *         description: List of all bookshelves
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bookshelf'
 */
router.get('/', BookshelfController.getAllBookshelves);

/**
 * @swagger
 * /api/v1/bookshelves/stats:
 *   get:
 *     summary: Get bookshelf statistics
 *     tags: [Bookshelves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookshelf statistics with book counts
 */
router.get('/stats', jwtConfig.requireAuth, BookshelfController.getBookshelfStats);

/**
 * @swagger
 * /api/v1/bookshelves/{id}:
 *   get:
 *     summary: Get bookshelf details with books
 *     tags: [Bookshelves]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Bookshelf ID
 *     responses:
 *       200:
 *         description: Bookshelf details with list of books
 *       404:
 *         description: Bookshelf not found
 */
router.get('/:id', BookshelfController.getBookshelfById);

/**
 * @swagger
 * /api/v1/bookshelves:
 *   post:
 *     summary: Create a new bookshelf (Admin only)
 *     tags: [Bookshelves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bookshelf'
 *     responses:
 *       201:
 *         description: Bookshelf created successfully
 *       400:
 *         description: Bookshelf code already exists
 *       403:
 *         description: Admin access required
 */
router.post('/', jwtConfig.requireAdmin, BookshelfController.createBookshelf);

/**
 * @swagger
 * /api/v1/bookshelves/{id}:
 *   put:
 *     summary: Update bookshelf (Admin only)
 *     tags: [Bookshelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Bookshelf ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bookshelf'
 *     responses:
 *       200:
 *         description: Bookshelf updated successfully
 *       400:
 *         description: Bookshelf code already exists
 *       404:
 *         description: Bookshelf not found
 *       403:
 *         description: Admin access required
 */
router.put('/:id', jwtConfig.requireAdmin, BookshelfController.updateBookshelf);

/**
 * @swagger
 * /api/v1/bookshelves/{id}:
 *   delete:
 *     summary: Delete bookshelf (Admin only)
 *     tags: [Bookshelves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Bookshelf ID
 *     responses:
 *       200:
 *         description: Bookshelf deleted successfully
 *       400:
 *         description: Cannot delete bookshelf with books
 *       404:
 *         description: Bookshelf not found
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', jwtConfig.requireAdmin, BookshelfController.deleteBookshelf);

/**
 * @swagger
 * /api/v1/bookshelves/move-books:
 *   post:
 *     summary: Move books between bookshelves (Admin only)
 *     tags: [Bookshelves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromBookshelfId
 *               - toBookshelfId
 *               - bookIds
 *             properties:
 *               fromBookshelfId:
 *                 type: string
 *                 description: Source bookshelf ID
 *               toBookshelfId:
 *                 type: string
 *                 description: Destination bookshelf ID
 *               bookIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of book IDs to move
 *     responses:
 *       200:
 *         description: Books moved successfully
 *       404:
 *         description: Bookshelf not found
 *       403:
 *         description: Admin access required
 */
router.post('/move-books', jwtConfig.requireAdmin, BookshelfController.moveBooks);

module.exports = router;
