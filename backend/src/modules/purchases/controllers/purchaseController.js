const purchaseService = require('../services/purchaseService');

/**
 * Purchase controller for handling HTTP requests
 */
class PurchaseController {
  /**
   * Get all purchases with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllPurchases(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        supplierId,
        userId,
        status,
        dateFrom,
        dateTo
      } = req.query;

      const filters = {};
      if (supplierId) filters.supplierId = supplierId;
      if (userId) filters.userId = userId;
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const result = await purchaseService.getAllPurchases(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching purchases:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch purchases'
      });
    }
  }

  /**
   * Get purchase by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPurchaseById(req, res) {
    try {
      const { id } = req.params;

      const purchase = await purchaseService.getPurchaseById(id);

      res.status(200).json({
        success: true,
        data: purchase
      });
    } catch (error) {
      console.error('Error fetching purchase:', error);

      if (error.message === 'Purchase not found') {
        return res.status(404).json({
          success: false,
          message: 'Purchase not found'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch purchase'
      });
    }
  }

  /**
   * Create a new purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createPurchase(req, res) {
    try {
      const purchaseData = req.body;
      const userId = req.user.id; // Assuming auth middleware sets req.user

      const purchase = await purchaseService.createPurchase(purchaseData, userId);

      res.status(201).json({
        success: true,
        message: 'Purchase created successfully',
        data: purchase
      });
    } catch (error) {
      console.error('Error creating purchase:', error);

      if (error.message.includes('not found') || error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create purchase'
      });
    }
  }

  /**
   * Update purchase by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updatePurchase(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const purchase = await purchaseService.updatePurchaseById(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Purchase updated successfully',
        data: purchase
      });
    } catch (error) {
      console.error('Error updating purchase:', error);

      if (error.message.includes('not found') || error.message.includes('Only pending') || error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update purchase'
      });
    }
  }

  /**
   * Complete a purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async completePurchase(req, res) {
    try {
      const { id } = req.params;

      const purchase = await purchaseService.completePurchase(id);

      res.status(200).json({
        success: true,
        message: 'Purchase completed successfully',
        data: purchase
      });
    } catch (error) {
      console.error('Error completing purchase:', error);

      if (error.message.includes('Only pending') || error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete purchase'
      });
    }
  }

  /**
   * Cancel a purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelPurchase(req, res) {
    try {
      const { id } = req.params;

      const purchase = await purchaseService.cancelPurchase(id);

      res.status(200).json({
        success: true,
        message: 'Purchase cancelled successfully',
        data: purchase
      });
    } catch (error) {
      console.error('Error cancelling purchase:', error);

      if (error.message.includes('Only pending') || error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel purchase'
      });
    }
  }

  /**
   * Delete purchase by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deletePurchase(req, res) {
    try {
      const { id } = req.params;

      await purchaseService.deletePurchaseById(id);

      res.status(200).json({
        success: true,
        message: 'Purchase deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting purchase:', error);

      if (error.message.includes('not found') || error.message.includes('Only pending')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete purchase'
      });
    }
  }

  /**
   * Get purchase statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPurchaseStats(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      const filters = {};
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const stats = await purchaseService.getPurchaseStats(filters);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching purchase statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch purchase statistics'
      });
    }
  }

  /**
   * Get purchases by supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPurchasesBySupplier(req, res) {
    try {
      const { supplierId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await purchaseService.getPurchasesBySupplier(
        supplierId,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching purchases by supplier:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch purchases by supplier'
      });
    }
  }

  /**
   * Get purchases by current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMyPurchases(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.id; // Assuming auth middleware sets req.user

      const result = await purchaseService.getPurchasesByUser(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch your purchases'
      });
    }
  }
}

module.exports = new PurchaseController();