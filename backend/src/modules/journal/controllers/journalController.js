const journalService = require('../services/journalService');

/**
 * Journal controller for handling journal entry-related HTTP requests
 */
class JournalController {
  /**
   * Get all journal entries with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllJournalEntries(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100'
        });
      }

      // Build filters from query parameters
      const filters = {};
      if (req.query.debitAccountId) filters.debitAccountId = req.query.debitAccountId;
      if (req.query.creditAccountId) filters.creditAccountId = req.query.creditAccountId;
      if (req.query.userId) filters.userId = req.query.userId;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      if (req.query.description) filters.description = req.query.description;

      const result = await journalService.getAllJournalEntries(page, limit, filters);

      res.status(200).json({
        message: 'Journal entries retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get journal entry by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getJournalEntryById(req, res, next) {
    try {
      const { entryId } = req.params;

      const entry = await journalService.getJournalEntryById(entryId);

      res.status(200).json({
        message: 'Journal entry retrieved successfully',
        entry
      });
    } catch (error) {
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createJournalEntry(req, res, next) {
    try {
      const entryData = req.body;

      // Add user ID from authenticated user
      entryData.userId = req.user.id;

      // Validate journal entry data
      journalService.validateJournalEntryData(entryData);

      const entry = await journalService.createJournalEntry(entryData);

      res.status(201).json({
        message: 'Journal entry created successfully',
        entry
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message.includes('not found or inactive')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message.includes('must be different')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update journal entry by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateJournalEntryById(req, res, next) {
    try {
      const { entryId } = req.params;
      const updateData = req.body;

      // Validate update data
      journalService.validateJournalEntryData(updateData, true);

      const entry = await journalService.updateJournalEntryById(entryId, updateData);

      res.status(200).json({
        message: 'Journal entry updated successfully',
        entry
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Journal entry not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message.includes('not found or inactive')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message.includes('must be different')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete journal entry by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteJournalEntryById(req, res, next) {
    try {
      const { entryId } = req.params;

      const entry = await journalService.deleteJournalEntryById(entryId);

      res.status(200).json({
        message: 'Journal entry deleted successfully',
        entry
      });
    } catch (error) {
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get journal summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getJournalSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Both startDate and endDate are required'
        });
      }

      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid date format'
        });
      }

      if (parsedStartDate > parsedEndDate) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Start date must be before end date'
        });
      }

      const summary = await journalService.getJournalSummary(parsedStartDate, parsedEndDate);

      res.status(200).json({
        message: 'Journal summary retrieved successfully',
        summary,
        period: {
          startDate: parsedStartDate,
          endDate: parsedEndDate
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get account balance from journal entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountBalance(req, res, next) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate } = req.query;

      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      // Validate dates
      if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid start date format'
        });
      }

      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid end date format'
        });
      }

      const balance = await journalService.getAccountBalance(accountId, parsedStartDate, parsedEndDate);

      res.status(200).json({
        message: 'Account balance retrieved successfully',
        accountId,
        balance,
        period: {
          startDate: parsedStartDate,
          endDate: parsedEndDate
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JournalController();