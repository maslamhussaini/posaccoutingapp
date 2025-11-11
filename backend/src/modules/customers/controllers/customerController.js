const customerService = require('../services/customerService');

/**
 * Customer controller for handling customer-related HTTP requests
 */
class CustomerController {
  /**
   * Get all customers with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCustomers(req, res, next) {
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

      const result = await customerService.getAllCustomers(page, limit, includeInactive);

      res.status(200).json({
        message: 'Customers retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCustomerById(req, res, next) {
    try {
      const { customerId } = req.params;

      const customer = await customerService.getCustomerById(customerId);

      res.status(200).json({
        message: 'Customer retrieved successfully',
        customer
      });
    } catch (error) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCustomer(req, res, next) {
    try {
      const customerData = req.body;

      // Validate customer data
      customerService.validateCustomerData(customerData);

      const customer = await customerService.createCustomer(customerData);

      res.status(201).json({
        message: 'Customer created successfully',
        customer
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Customer with this email already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update customer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCustomerById(req, res, next) {
    try {
      const { customerId } = req.params;
      const updateData = req.body;

      // Validate update data
      customerService.validateCustomerData(updateData, true);

      const customer = await customerService.updateCustomerById(customerId, updateData);

      res.status(200).json({
        message: 'Customer updated successfully',
        customer
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Customer with this email already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete customer by ID (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCustomerById(req, res, next) {
    try {
      const { customerId } = req.params;

      const customer = await customerService.deleteCustomerById(customerId);

      res.status(200).json({
        message: 'Customer deleted successfully',
        customer
      });
    } catch (error) {
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get customers with sales counts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCustomersWithSalesCounts(req, res, next) {
    try {
      const customers = await customerService.getCustomersWithSalesCounts();

      res.status(200).json({
        message: 'Customers with sales counts retrieved successfully',
        customers
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();