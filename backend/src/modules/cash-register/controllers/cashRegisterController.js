const cashRegisterService = require('../services/cashRegisterService');
const cashMovementModel = require('../models/cashMovementModel');

/**
 * Cash register controller for handling cash register-related HTTP requests
 */
class CashRegisterController {
  /**
   * Get all cash registers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCashRegisters(req, res, next) {
    try {
      const cashRegisters = await cashRegisterService.getAllCashRegisters();

      res.status(200).json({
        message: 'Cash registers retrieved successfully',
        cashRegisters
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cash register by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCashRegisterById(req, res, next) {
    try {
      const { registerId } = req.params;

      const cashRegister = await cashRegisterService.getCashRegisterById(registerId);

      res.status(200).json({
        message: 'Cash register retrieved successfully',
        cashRegister
      });
    } catch (error) {
      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new cash register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCashRegister(req, res, next) {
    try {
      const registerData = req.body;

      const cashRegister = await cashRegisterService.createCashRegister(registerData);

      res.status(201).json({
        message: 'Cash register created successfully',
        cashRegister
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Cash register with this name already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update cash register by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCashRegisterById(req, res, next) {
    try {
      const { registerId } = req.params;
      const updateData = req.body;

      const cashRegister = await cashRegisterService.updateCashRegisterById(registerId, updateData);

      res.status(200).json({
        message: 'Cash register updated successfully',
        cashRegister
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Cash register with this name already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete cash register by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCashRegisterById(req, res, next) {
    try {
      const { registerId } = req.params;

      const cashRegister = await cashRegisterService.deleteCashRegisterById(registerId);

      res.status(200).json({
        message: 'Cash register deleted successfully',
        cashRegister
      });
    } catch (error) {
      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Open cash register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async openCashRegister(req, res, next) {
    try {
      const { registerId } = req.params;
      const { openingBalance } = req.body;
      const userId = req.user.userId;

      // Validate opening balance
      if (openingBalance === undefined || openingBalance < 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Valid opening balance is required'
        });
      }

      const cashRegister = await cashRegisterService.openCashRegister(registerId, openingBalance, userId);

      res.status(200).json({
        message: 'Cash register opened successfully',
        cashRegister
      });
    } catch (error) {
      if (error.message.includes('already open') || error.message.includes('already has an open')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Close cash register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async closeCashRegister(req, res, next) {
    try {
      const { registerId } = req.params;
      const { actualBalance } = req.body;
      const userId = req.user.userId;

      // Validate actual balance
      if (actualBalance === undefined || actualBalance < 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Valid actual balance is required'
        });
      }

      const result = await cashRegisterService.closeCashRegister(registerId, actualBalance, userId);

      res.status(200).json({
        message: 'Cash register closed successfully',
        ...result
      });
    } catch (error) {
      if (error.message.includes('not open') || error.message.includes('cannot close')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Record cash deposit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async recordDeposit(req, res, next) {
    try {
      const { registerId } = req.params;
      const { amount, description } = req.body;
      const userId = req.user.userId;

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Valid deposit amount is required'
        });
      }

      const movement = await cashRegisterService.recordDeposit(registerId, amount, description, userId);

      res.status(201).json({
        message: 'Deposit recorded successfully',
        movement
      });
    } catch (error) {
      if (error.message.includes('not open') || error.message.includes('Insufficient')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Record cash withdrawal
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async recordWithdrawal(req, res, next) {
    try {
      const { registerId } = req.params;
      const { amount, description } = req.body;
      const userId = req.user.userId;

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Valid withdrawal amount is required'
        });
      }

      const movement = await cashRegisterService.recordWithdrawal(registerId, amount, description, userId);

      res.status(201).json({
        message: 'Withdrawal recorded successfully',
        movement
      });
    } catch (error) {
      if (error.message.includes('not open') || error.message.includes('Insufficient')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get cash movements for a register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCashMovements(req, res, next) {
    try {
      const { registerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100'
        });
      }

      const result = await cashMovementModel.findByRegisterId(registerId, page, limit);

      res.status(200).json({
        message: 'Cash movements retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get daily summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDailySummary(req, res, next) {
    try {
      const { date, registerId } = req.query;

      // Validate date
      if (!date) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Date parameter is required'
        });
      }

      const summaryDate = new Date(date);
      if (isNaN(summaryDate.getTime())) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid date format'
        });
      }

      const summary = await cashRegisterService.getDailySummary(summaryDate, registerId);

      res.status(200).json({
        message: 'Daily summary retrieved successfully',
        summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user register status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserRegisterStatus(req, res, next) {
    try {
      const userId = req.user.userId;

      const status = await cashRegisterService.getUserRegisterStatus(userId);

      res.status(200).json({
        message: 'User register status retrieved successfully',
        status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expected balance for a register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getExpectedBalance(req, res, next) {
    try {
      const { registerId } = req.params;

      const expectedBalance = await cashRegisterService.calculateExpectedBalance(registerId);

      res.status(200).json({
        message: 'Expected balance calculated successfully',
        registerId,
        expectedBalance
      });
    } catch (error) {
      if (error.message === 'Cash register not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }
}

module.exports = new CashRegisterController();