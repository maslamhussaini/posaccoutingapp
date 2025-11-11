const express = require('express');
const router = express.Router();
const chartOfAccountsController = require('../controllers/chartOfAccountsController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Chart of Accounts routes
 * Base path: /api/chart-of-accounts
 */

// GET /api/chart-of-accounts - Get all accounts (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  chartOfAccountsController.getAllAccounts
);

// GET /api/chart-of-accounts/hierarchy - Get account hierarchy (Authenticated users)
router.get(
  '/hierarchy',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  chartOfAccountsController.getAccountHierarchy
);

// GET /api/chart-of-accounts/trial-balance - Get trial balance (Manager and Admin)
router.get(
  '/trial-balance',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  chartOfAccountsController.getTrialBalance
);

// GET /api/chart-of-accounts/type/:type - Get accounts by type (Authenticated users)
router.get(
  '/type/:type',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  chartOfAccountsController.getAccountsByType
);

// GET /api/chart-of-accounts/code/:code - Get account by code (Authenticated users)
router.get(
  '/code/:code',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  chartOfAccountsController.getAccountByCode
);

// GET /api/chart-of-accounts/:accountId - Get account by ID (Authenticated users)
router.get(
  '/:accountId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  chartOfAccountsController.getAccountById
);

// GET /api/chart-of-accounts/:accountId/balance - Get account balance (Authenticated users)
router.get(
  '/:accountId/balance',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  chartOfAccountsController.getAccountBalance
);

// POST /api/chart-of-accounts - Create new account (Manager and Admin)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  chartOfAccountsController.createAccount
);

// PUT /api/chart-of-accounts/:accountId - Update account by ID (Manager and Admin)
router.put(
  '/:accountId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  chartOfAccountsController.updateAccountById
);

// DELETE /api/chart-of-accounts/:accountId - Soft delete account by ID (Manager and Admin)
router.delete(
  '/:accountId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  chartOfAccountsController.deleteAccountById
);

module.exports = router;