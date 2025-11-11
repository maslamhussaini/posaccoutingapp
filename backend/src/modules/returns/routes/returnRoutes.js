const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Return routes
 * Base path: /api/returns
 */

// GET /api/returns - Get all returns (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  returnController.getAllReturns
);

// GET /api/returns/stats - Get returns statistics (Manager and Admin)
router.get(
  '/stats',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  returnController.getReturnsStats
);

// POST /api/returns/calculate - Calculate refund amount for return items (Authenticated users)
router.post(
  '/calculate',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  returnController.calculateRefundAmount
);

// GET /api/returns/:returnId - Get return by ID (Authenticated users)
router.get(
  '/:returnId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  returnController.getReturnById
);

// POST /api/returns - Create new return (Authenticated users)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  returnController.createReturn
);

// PATCH /api/returns/:returnId/status - Update return status (Manager and Admin)
router.patch(
  '/:returnId/status',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  returnController.updateReturnStatus
);

// PATCH /api/returns/:returnId/approve - Approve return (Manager and Admin)
router.patch(
  '/:returnId/approve',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  returnController.approveReturn
);

// PATCH /api/returns/:returnId/reject - Reject return (Manager and Admin)
router.patch(
  '/:returnId/reject',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  returnController.rejectReturn
);

module.exports = router;