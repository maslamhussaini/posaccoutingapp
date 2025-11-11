const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Sale routes
 * Base path: /api/sales
 */

// GET /api/sales - Get all sales (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  saleController.getAllSales
);

// GET /api/sales/stats - Get sales statistics (Manager and Admin)
router.get(
  '/stats',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  saleController.getSalesStats
);

// GET /api/sales/scan/:barcode - Scan barcode for POS (Authenticated users)
router.get(
  '/scan/:barcode',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  saleController.scanBarcode
);

// POST /api/sales/calculate - Calculate totals for cart items (Authenticated users)
router.post(
  '/calculate',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  saleController.calculateTotals
);

// GET /api/sales/:saleId - Get sale by ID (Authenticated users)
router.get(
  '/:saleId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  saleController.getSaleById
);

// POST /api/sales - Create new sale (POS checkout) (Authenticated users)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  saleController.createSale
);

// PATCH /api/sales/:saleId/status - Update sale status (Manager and Admin)
router.patch(
  '/:saleId/status',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  saleController.updateSaleStatus
);

module.exports = router;