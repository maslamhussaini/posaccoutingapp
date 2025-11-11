const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Reports routes
 * Base path: /api/reports
 */

// GET /api/reports/dashboard - Get dashboard summary (Manager and Admin)
router.get(
  '/dashboard',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  reportsController.getDashboardSummary
);

// GET /api/reports/sales - Get sales report (Manager and Admin)
router.get(
  '/sales',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  reportsController.getSalesReport
);

// GET /api/reports/inventory - Get inventory report (Manager and Admin)
router.get(
  '/inventory',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  reportsController.getInventoryReport
);

// GET /api/reports/best-sellers - Get best-seller report (Manager and Admin)
router.get(
  '/best-sellers',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  reportsController.getBestSellerReport
);

// GET /api/reports/profit-loss - Get Profit & Loss report (Admin only)
router.get(
  '/profit-loss',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  reportsController.getProfitLossReport
);

// GET /api/reports/account-balances - Get account balances report (Admin only)
router.get(
  '/account-balances',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  reportsController.getAccountBalancesReport
);

// GET /api/reports/export/:type/:format - Export report (Manager and Admin)
router.get(
  '/export/:type/:format',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  reportsController.exportReport
);

module.exports = router;