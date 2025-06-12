const express = require('express');
const router = express.Router();
const BorrowManagementController = require('../controller/BorrowManagementController');
const jwtConfig = require('../config/jwtconfig');

/**
 * @swagger
 * components:
 *   schemas:
 *     BorrowManagement:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for declining request
 *         condition:
 *           type: string
 *           enum: [good, damaged, lost]
 *           description: Book condition when returned
 *         notes:
 *           type: string
 *           description: Additional notes
 *         days:
 *           type: number
 *           description: Number of days to extend
 */

/**
 * @swagger
 * /api/v1/admin/borrow-requests:
 *   get:
 *     summary: Get all borrow requests (Admin/Staff only)
 *     tags: [Borrow Management]
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
 *         description: Filter by status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         description: Filter by book ID
 *       - in: query
 *         name: isOverdue
 *         schema:
 *           type: boolean
 *         description: Filter overdue books
 *     responses:
 *       200:
 *         description: List of borrow requests
 *       403:
 *         description: Admin/Staff access required
 */
router.get('/', jwtConfig.requireAuth, BorrowManagementController.getAllBorrowRequests);

/**
 * @swagger
 * /api/v1/admin/borrow-requests/statistics:
 *   get:
 *     summary: Get borrow statistics (Admin/Staff only)
 *     tags: [Borrow Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Borrow statistics
 *       403:
 *         description: Admin/Staff access required
 */
router.get('/statistics', jwtConfig.requireAuth, BorrowManagementController.getBorrowStatistics);

/**
 * @swagger
 * /api/v1/admin/borrow-requests/{id}/approve:
 *   post:
 *     summary: Approve a borrow request (Admin/Staff only)
 *     tags: [Borrow Management]
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
 *         description: Borrow request approved successfully
 *       400:
 *         description: Only pending requests can be approved or book not available
 *       404:
 *         description: Borrow request not found
 *       403:
 *         description: Admin/Staff access required
 */
router.post('/:id/approve', jwtConfig.requireAuth, BorrowManagementController.approveBorrowRequest);

/**
 * @swagger
 * /api/v1/admin/borrow-requests/{id}/decline:
 *   post:
 *     summary: Decline a borrow request (Admin/Staff only)
 *     tags: [Borrow Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Borrow request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for declining
 *     responses:
 *       200:
 *         description: Borrow request declined successfully
 *       400:
 *         description: Only pending requests can be declined
 *       404:
 *         description: Borrow request not found
 *       403:
 *         description: Admin/Staff access required
 */
router.post('/:id/decline', jwtConfig.requireAuth, BorrowManagementController.declineBorrowRequest);

/**
 * @swagger
 * /api/v1/admin/borrow-requests/{id}/return:
 *   post:
 *     summary: Process book return (Admin/Staff only)
 *     tags: [Borrow Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Borrow request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *                 enum: [good, damaged, lost]
 *                 default: good
 *                 description: Book condition when returned
 *               notes:
 *                 type: string
 *                 description: Additional notes about the return
 *     responses:
 *       200:
 *         description: Book returned successfully
 *       400:
 *         description: Only borrowed books can be returned
 *       404:
 *         description: Borrow record not found
 *       403:
 *         description: Admin/Staff access required
 */
router.post('/:id/return', jwtConfig.requireAuth, BorrowManagementController.returnBook);

/**
 * @swagger
 * /api/v1/admin/borrow-requests/{id}/extend:
 *   post:
 *     summary: Extend borrow period (Admin/Staff only)
 *     tags: [Borrow Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Borrow request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: number
 *                 default: 7
 *                 description: Number of days to extend
 *     responses:
 *       200:
 *         description: Borrow period extended successfully
 *       400:
 *         description: Only currently borrowed books can be extended or user has outstanding fines
 *       404:
 *         description: Borrow record not found
 *       403:
 *         description: Admin/Staff access required
 */
router.post('/:id/extend', jwtConfig.requireAuth, BorrowManagementController.extendBorrowPeriod);

module.exports = router;
