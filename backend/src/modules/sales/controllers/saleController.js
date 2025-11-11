const saleService = require('../services/saleService');

/**
 * Sale controller for handling sale-related HTTP requests
 */
class SaleController {
  /**
   * Get all sales with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllSales(req, res, next) {
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
      if (req.query.customerId) filters.customerId = req.query.customerId;
      if (req.query.userId) filters.userId = req.query.userId;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;

      const result = await saleService.getAllSales(page, limit, filters);

      res.status(200).json({
        message: 'Sales retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sale by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSaleById(req, res, next) {
    try {
      const { saleId } = req.params;

      const sale = await saleService.getSaleById(saleId);

      res.status(200).json({
        message: 'Sale retrieved successfully',
        sale
      });
    } catch (error) {
      if (error.message === 'Sale not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new sale (POS checkout)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createSale(req, res, next) {
    try {
      const saleData = req.body;

      // Add user ID from authenticated user
      saleData.userId = req.user.id;

      // Validate sale data
      saleService.validateSaleData(saleData);

      const sale = await saleService.createSale(saleData);

      res.status(201).json({
        message: 'Sale completed successfully',
        sale
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Customer not found') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message.includes('Product not found') ||
          error.message.includes('Insufficient stock') ||
          error.message.includes('Payment amount')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Scan barcode for POS
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async scanBarcode(req, res, next) {
    try {
      const { barcode } = req.params;

      if (!barcode) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Barcode is required'
        });
      }

      const product = await saleService.scanBarcode(barcode);

      res.status(200).json({
        message: 'Product scanned successfully',
        product
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Calculate totals for cart items
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async calculateTotals(req, res, next) {
    try {
      const { items, discount = 0, discountType = 'fixed', tax = 0 } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Items array is required'
        });
      }

      const totals = await saleService.calculateTotals(items, discount, discountType, tax);

      res.status(200).json({
        message: 'Totals calculated successfully',
        totals
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

  /**
   * Update sale status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateSaleStatus(req, res, next) {
    try {
      const { saleId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Status is required'
        });
      }

      const sale = await saleService.updateSaleStatus(saleId, status);

      res.status(200).json({
        message: `Sale status updated to ${status}`,
        sale
      });
    } catch (error) {
      if (error.message === 'Sale not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Invalid sale status') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get sales statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSalesStats(req, res, next) {
    try {
      const filters = {};
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      if (req.query.userId) filters.userId = req.query.userId;

      const stats = await saleService.getSalesStats(filters);

      res.status(200).json({
        message: 'Sales statistics retrieved successfully',
        stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SaleController();