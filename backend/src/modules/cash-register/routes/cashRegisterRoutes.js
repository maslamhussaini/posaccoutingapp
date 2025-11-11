const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Cash register routes
 * Base path: /api/cash-registers
 */

// GET /api/cash-registers - Get all cash registers (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.getAllCashRegisters
);

// GET /api/cash-registers/status - Get current user's register status (Authenticated users)
router.get(
  '/status',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.getUserRegisterStatus
);

// GET /api/cash-registers/daily-summary - Get daily summary (Authenticated users)
router.get(
  '/daily-summary',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.getDailySummary
);

// POST /api/cash-registers - Create new cash register (Admin only)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  cashRegisterController.createCashRegister
);

// GET /api/cash-registers/:registerId - Get cash register by ID (Authenticated users)
router.get(
  '/:registerId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.getCashRegisterById
);

// PUT /api/cash-registers/:registerId - Update cash register by ID (Admin only)
router.put(
  '/:registerId',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  cashRegisterController.updateCashRegisterById
);

// DELETE /api/cash-registers/:registerId - Delete cash register by ID (Admin only)
router.delete(
  '/:registerId',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  cashRegisterController.deleteCashRegisterById
);

// POST /api/cash-registers/:registerId/open - Open cash register (Authenticated users)
router.post(
  '/:registerId/open',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.openCashRegister
);

// POST /api/cash-registers/:registerId/close - Close cash register (Authenticated users)
router.post(
  '/:registerId/close',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.closeCashRegister
);

// POST /api/cash-registers/:registerId/deposit - Record cash deposit (Authenticated users)
router.post(
  '/:registerId/deposit',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.recordDeposit
);

// POST /api/cash-registers/:registerId/withdraw - Record cash withdrawal (Authenticated users)
router.post(
  '/:registerId/withdraw',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.recordWithdrawal
);

// GET /api/cash-registers/:registerId/movements - Get cash movements for register (Authenticated users)
router.get(
  '/:registerId/movements',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.getCashMovements
);

// GET /api/cash-registers/:registerId/expected-balance - Get expected balance (Authenticated users)
router.get(
  '/:registerId/expected-balance',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  cashRegisterController.getExpectedBalance
);

module.exports = router;