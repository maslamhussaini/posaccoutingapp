const supplierService = require('../services/supplierService');

/**
 * Supplier controller for handling supplier-related HTTP requests
 */
class SupplierController {
  /**
   * Get all suppliers with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllSuppliers(req, res, next) {
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

      const includeInactive = req.query.includeInactive === 'true';

      const result = await supplierService.getAllSuppliers(page, limit, includeInactive);

      res.status(200).json({
        message: 'Suppliers retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supplier by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSupplierById(req, res, next) {
    try {
      const { supplierId } = req.params;

      const supplier = await supplierService.getSupplierById(supplierId);

      res.status(200).json({
        message: 'Supplier retrieved successfully',
        supplier
      });
    } catch (error) {
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createSupplier(req, res, next) {
    try {
      const supplierData = req.body;

      // Validate supplier data
      supplierService.validateSupplierData(supplierData);

      const supplier = await supplierService.createSupplier(supplierData);

      res.status(201).json({
        message: 'Supplier created successfully',
        supplier
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Supplier with this email already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update supplier by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateSupplierById(req, res, next) {
    try {
      const { supplierId } = req.params;
      const updateData = req.body;

      // Validate update data
      supplierService.validateSupplierData(updateData, true);

      const supplier = await supplierService.updateSupplierById(supplierId, updateData);

      res.status(200).json({
        message: 'Supplier updated successfully',
        supplier
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Supplier with this email already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete supplier by ID (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteSupplierById(req, res, next) {
    try {
      const { supplierId } = req.params;

      const supplier = await supplierService.deleteSupplierById(supplierId);

      res.status(200).json({
        message: 'Supplier deleted successfully',
        supplier
      });
    } catch (error) {
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Cannot delete supplier with associated products') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get suppliers with product counts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSuppliersWithProductCounts(req, res, next) {
    try {
      const suppliers = await supplierService.getSuppliersWithProductCounts();

      res.status(200).json({
        message: 'Suppliers with product counts retrieved successfully',
        suppliers
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupplierController();