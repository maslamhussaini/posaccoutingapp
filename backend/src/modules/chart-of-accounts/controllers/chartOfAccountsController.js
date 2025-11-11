const chartOfAccountsService = require('../services/chartOfAccountsService');

/**
 * Chart of Accounts controller for handling account-related HTTP requests
 */
class ChartOfAccountsController {
  /**
   * Get all accounts with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllAccounts(req, res, next) {
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
      if (req.query.type) filters.type = req.query.type;
      if (req.query.parentId) filters.parentId = req.query.parentId;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.includeInactive === 'true') filters.includeInactive = true;

      const result = await chartOfAccountsService.getAllAccounts(page, limit, filters);

      res.status(200).json({
        message: 'Accounts retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get account by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountById(req, res, next) {
    try {
      const { accountId } = req.params;

      const account = await chartOfAccountsService.getAccountById(accountId);

      res.status(200).json({
        message: 'Account retrieved successfully',
        account
      });
    } catch (error) {
      if (error.message === 'Account not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get account by code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountByCode(req, res, next) {
    try {
      const { code } = req.params;

      const account = await chartOfAccountsService.getAccountByCode(code);

      res.status(200).json({
        message: 'Account retrieved successfully',
        account
      });
    } catch (error) {
      if (error.message === 'Account not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createAccount(req, res, next) {
    try {
      const accountData = req.body;

      // Validate account data
      chartOfAccountsService.validateAccountData(accountData);

      const account = await chartOfAccountsService.createAccount(accountData);

      res.status(201).json({
        message: 'Account created successfully',
        account
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Parent account not found') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update account by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateAccountById(req, res, next) {
    try {
      const { accountId } = req.params;
      const updateData = req.body;

      // Validate update data
      chartOfAccountsService.validateAccountData(updateData, true);

      const account = await chartOfAccountsService.updateAccountById(accountId, updateData);

      res.status(200).json({
        message: 'Account updated successfully',
        account
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Account not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Parent account not found' || error.message === 'Account cannot be its own parent') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete account by ID (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteAccountById(req, res, next) {
    try {
      const { accountId } = req.params;

      const account = await chartOfAccountsService.deleteAccountById(accountId);

      res.status(200).json({
        message: 'Account deleted successfully',
        account
      });
    } catch (error) {
      if (error.message === 'Account not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message.includes('Cannot delete account')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get account hierarchy
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountHierarchy(req, res, next) {
    try {
      const hierarchy = await chartOfAccountsService.getAccountHierarchy();

      res.status(200).json({
        message: 'Account hierarchy retrieved successfully',
        hierarchy
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get accounts by type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountsByType(req, res, next) {
    try {
      const { type } = req.params;

      const accounts = await chartOfAccountsService.getAccountsByType(type.toUpperCase());

      res.status(200).json({
        message: `${type} accounts retrieved successfully`,
        accounts,
        count: accounts.length
      });
    } catch (error) {
      if (error.message === 'Invalid account type') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get account balance
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

      const balanceInfo = await chartOfAccountsService.getAccountBalance(accountId, parsedStartDate, parsedEndDate);

      res.status(200).json({
        message: 'Account balance retrieved successfully',
        ...balanceInfo
      });
    } catch (error) {
      if (error.message === 'Account not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get trial balance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTrialBalance(req, res, next) {
    try {
      const { asOfDate } = req.query;
      const parsedAsOfDate = asOfDate ? new Date(asOfDate) : new Date();

      // Validate date
      if (isNaN(parsedAsOfDate.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid date format'
        });
      }

      const trialBalance = await chartOfAccountsService.getTrialBalance(parsedAsOfDate);

      res.status(200).json({
        message: 'Trial balance retrieved successfully',
        ...trialBalance
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChartOfAccountsController();