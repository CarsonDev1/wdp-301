const express = require('express');
const router = express.Router();
const FineController = require('../controller/FineController');
const jwtConfig = require('../config/jwtconfig');

/**
 * @swagger
 * components:
 *   schemas:
 *     Fine:
 *       type: object
 *       required:
 *         - userId
 *         - reason
 *         - amount
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID who owes the fine
 *         borrowRecordId:
 *           type: string
 *           description: Related borrow record ID (optional)
 *         reason:
 *           type: string
 *           enum: [overdue, lost]
 *           description: Reason for the fine
 *         amount:
 *           type: number
 *           description: Fine amount in VND
 *         note:
 *           type: string
 *           description: Additional notes about the fine
 */

/**
 * @swagger
 * /api/v1/fines:
 *   get:
 *     summary: Get all fines (Admin/Staff only)
 *     tags: [Fines]
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
 *         name: paid
 *         schema:
 *           type: boolean
 *         description: Filter by payment status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [overdue, lost]
 *         description: Filter by fine reason
 *     responses:
 *       200:
 *         description: List of fines with pagination and summary
 *       403:
 *         description: Admin/Staff access required
 */
router.get('/', jwtConfig.requireAuth, FineController.getAllFines);

/**
 * @swagger
 * /api/v1/fines/my-fines:
 *   get:
 *     summary: Get current user's fines
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paid
 *         schema:
 *           type: boolean
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: User's fines with total unpaid amount
 */
router.get('/my-fines', jwtConfig.requireAuth, FineController.getUserFines);

/**
 * @swagger
 * /api/v1/fines/statistics:
 *   get:
 *     summary: Get fine statistics (Admin/Staff only)
 *     tags: [Fines]
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
 *         description: Fine statistics with trends and top users
 *       403:
 *         description: Admin/Staff access required
 */
router.get('/statistics', jwtConfig.requireAuth, FineController.getFineStatistics);

/**
 * @swagger
 * /api/v1/fines/{id}:
 *   get:
 *     summary: Get fine details by ID (Admin/Staff only)
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Fine ID
 *     responses:
 *       200:
 *         description: Fine details
 *       404:
 *         description: Fine not found
 *       403:
 *         description: Admin/Staff access required
 */
router.get('/:id', jwtConfig.requireAuth, FineController.getFineById);

/**
 * @swagger
 * /api/v1/fines:
 *   post:
 *     summary: Create manual fine (Admin/Staff only)
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fine'
 *     responses:
 *       201:
 *         description: Manual fine created successfully
 *       404:
 *         description: User or borrow record not found
 *       403:
 *         description: Admin/Staff access required
 */
router.post('/', jwtConfig.requireAuth, FineController.createManualFine);

/**
 * @swagger
 * /api/v1/fines/{id}/pay:
 *   post:
 *     summary: Mark fine as paid (Admin/Staff only)
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Fine ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *               note:
 *                 type: string
 *                 description: Payment notes
 *     responses:
 *       200:
 *         description: Fine marked as paid successfully
 *       400:
 *         description: Fine is already paid
 *       404:
 *         description: Fine not found
 *       403:
 *         description: Admin/Staff access required
 */
router.post('/:id/pay', jwtConfig.requireAuth, FineController.markFineAsPaid);

/**
 * @swagger
 * /api/v1/fines/{id}:
 *   delete:
 *     summary: Delete fine (Admin only)
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Fine ID
 *     responses:
 *       200:
 *         description: Fine deleted successfully
 *       400:
 *         description: Cannot delete a paid fine
 *       404:
 *         description: Fine not found
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', jwtConfig.requireAdmin, FineController.deleteFine);

module.exports = router;
