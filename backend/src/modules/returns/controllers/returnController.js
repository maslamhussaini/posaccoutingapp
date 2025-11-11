const returnService = require('../services/returnService');

/**
 * Return controller for handling return-related HTTP requests
 */
class ReturnController {
  /**
   * Get all returns with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllReturns(req, res, next) {
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
      if (req.query.saleId) filters.saleId = req.query.saleId;
      if (req.query.userId) filters.userId = req.query.userId;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;

      const result = await returnService.getAllReturns(page, limit, filters);

      res.status(200).json({
        message: 'Returns retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get return by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReturnById(req, res, next) {
    try {
      const { returnId } = req.params;

      const returnObj = await returnService.getReturnById(returnId);

      res.status(200).json({
        message: 'Return retrieved successfully',
        return: returnObj
      });
    } catch (error) {
      if (error.message === 'Return not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new return
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createReturn(req, res, next) {
    try {
      const returnData = req.body;

      // Add user ID from authenticated user
      returnData.userId = req.user.id;

      // Validate return data
      returnService.validateReturnData(returnData);

      const returnObj = await returnService.createReturn(returnData);

      res.status(201).json({
        message: 'Return processed successfully',
        return: returnObj
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Sale not found' ||
          error.message.includes('Can only return completed sales') ||
          error.message.includes('was not part of this sale') ||
          error.message.includes('Cannot return more than') ||
          error.message.includes('is no longer available')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update return status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateReturnStatus(req, res, next) {
    try {
      const { returnId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Status is required'
        });
      }

      const returnObj = await returnService.updateReturnStatus(returnId, status);

      res.status(200).json({
        message: `Return status updated to ${status}`,
        return: returnObj
      });
    } catch (error) {
      if (error.message === 'Return not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Invalid return status') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Approve a return request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async approveReturn(req, res, next) {
    try {
      const { returnId } = req.params;

      const returnObj = await returnService.approveReturn(returnId);

      res.status(200).json({
        message: 'Return approved and processed successfully',
        return: returnObj
      });
    } catch (error) {
      if (error.message === 'Return not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message.includes('not in pending status')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Reject a return request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async rejectReturn(req, res, next) {
    try {
      const { returnId } = req.params;
      const { reason } = req.body;

      const returnObj = await returnService.rejectReturn(returnId, reason);

      res.status(200).json({
        message: 'Return rejected successfully',
        return: returnObj
      });
    } catch (error) {
      if (error.message === 'Return not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message.includes('not in pending status')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get returns statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReturnsStats(req, res, next) {
    try {
      const filters = {};
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      if (req.query.userId) filters.userId = req.query.userId;

      const stats = await returnService.getReturnsStats(filters);

      res.status(200).json({
        message: 'Returns statistics retrieved successfully',
        stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate refund amount for return items
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async calculateRefundAmount(req, res, next) {
    try {
      const { saleId, items } = req.body;

      if (!saleId) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Sale ID is required'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Items array is required'
        });
      }

      // Get the sale to calculate refund
      const saleModel = require('../../sales/models/saleModel');
      const sale = await saleModel.findById(saleId);

      if (!sale) {
        return res.status(404).json({
          error: 'NotFoundError',
          message: 'Sale not found'
        });
      }

      const refundAmount = await returnService.calculateRefundAmount(items, sale);

      res.status(200).json({
        message: 'Refund amount calculated successfully',
        refundAmount,
        saleId,
        items
      });
    } catch (error) {
      if (error.message.includes('Product not found')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }
}

module.exports = new ReturnController();