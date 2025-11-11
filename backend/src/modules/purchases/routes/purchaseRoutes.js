const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

const router = express.Router();

/**
 * Purchase routes
 * All routes require authentication
 */

// GET /api/purchases - Get all purchases with pagination and filters
router.get('/', authMiddleware, purchaseController.getAllPurchases);

// GET /api/purchases/stats - Get purchase statistics
router.get('/stats', authMiddleware, purchaseController.getPurchaseStats);

// GET /api/purchases/my - Get current user's purchases
router.get('/my', authMiddleware, purchaseController.getMyPurchases);

// GET /api/purchases/suppliers/:supplierId - Get purchases by supplier
router.get('/suppliers/:supplierId', authMiddleware, purchaseController.getPurchasesBySupplier);

// GET /api/purchases/:id - Get purchase by ID
router.get('/:id', authMiddleware, purchaseController.getPurchaseById);

// POST /api/purchases - Create a new purchase
router.post('/', authMiddleware, purchaseController.createPurchase);

// PUT /api/purchases/:id - Update purchase by ID
router.put('/:id', authMiddleware, purchaseController.updatePurchase);

// PATCH /api/purchases/:id/complete - Complete a purchase
router.patch('/:id/complete', authMiddleware, purchaseController.completePurchase);

// PATCH /api/purchases/:id/cancel - Cancel a purchase
router.patch('/:id/cancel', authMiddleware, purchaseController.cancelPurchase);

// DELETE /api/purchases/:id - Delete purchase by ID
router.delete('/:id', authMiddleware, purchaseController.deletePurchase);

module.exports = router;