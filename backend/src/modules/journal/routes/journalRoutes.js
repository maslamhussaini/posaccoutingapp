const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Journal routes
 * Base path: /api/journal
 */

// GET /api/journal - Get all journal entries (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  journalController.getAllJournalEntries
);

// GET /api/journal/summary - Get journal summary (Manager and Admin)
router.get(
  '/summary',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  journalController.getJournalSummary
);

// GET /api/journal/:entryId - Get journal entry by ID (Authenticated users)
router.get(
  '/:entryId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  journalController.getJournalEntryById
);

// GET /api/journal/accounts/:accountId/balance - Get account balance (Authenticated users)
router.get(
  '/accounts/:accountId/balance',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  journalController.getAccountBalance
);

// POST /api/journal - Create new journal entry (Manager and Admin)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  journalController.createJournalEntry
);

// PUT /api/journal/:entryId - Update journal entry by ID (Manager and Admin)
router.put(
  '/:entryId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  journalController.updateJournalEntryById
);

// DELETE /api/journal/:entryId - Delete journal entry by ID (Manager and Admin)
router.delete(
  '/:entryId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  journalController.deleteJournalEntryById
);

module.exports = router;