const customerModel = require('../models/customerModel');

/**
 * Customer service for business logic
 */
class CustomerService {
  /**
   * Get customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomerById(customerId) {
    const customer = await customerModel.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  /**
   * Get all customers with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {boolean} includeInactive - Whether to include inactive customers
   * @returns {Promise<Object>} Paginated customers
   */
  async getAllCustomers(page = 1, limit = 10, includeInactive = false) {
    return await customerModel.findAll(page, limit, includeInactive);
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    // Check if customer with same email already exists
    if (customerData.email) {
      const existingCustomer = await customerModel.findByEmail(customerData.email);
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }
    }

    return await customerModel.create(customerData);
  }

  /**
   * Update customer by ID
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomerById(customerId, updateData) {
    return await customerModel.updateById(customerId, updateData);
  }

  /**
   * Delete customer by ID (soft delete)
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Deleted customer
   */
  async deleteCustomerById(customerId) {
    return await customerModel.deleteById(customerId);
  }

  /**
   * Get customers with sales counts
   * @returns {Promise<Array>} Array of customers with sales counts
   */
  async getCustomersWithSalesCounts() {
    return await customerModel.getCustomersWithSalesCounts();
  }

  /**
   * Validate customer data
   * @param {Object} customerData - Customer data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateCustomerData(customerData, isUpdate = false) {
    const errors = [];

    // Name validation
    if (!isUpdate || customerData.name !== undefined) {
      if (!customerData.name || customerData.name.trim().length === 0) {
        errors.push('Customer name is required');
      } else if (customerData.name.length > 100) {
        errors.push('Customer name must be less than 100 characters');
      }
    }

    // Email validation (optional)
    if (customerData.email !== undefined && customerData.email !== null) {
      if (customerData.email.trim().length === 0) {
        customerData.email = null; // Convert empty string to null
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
          errors.push('Invalid email format');
        } else if (customerData.email.length > 100) {
          errors.push('Email must be less than 100 characters');
        }
      }
    }

    // Phone validation (optional)
    if (customerData.phone !== undefined && customerData.phone !== null) {
      if (customerData.phone.trim().length === 0) {
        customerData.phone = null; // Convert empty string to null
      } else if (customerData.phone.length > 20) {
        errors.push('Phone number must be less than 20 characters');
      }
    }

    // Address validation (optional)
    if (customerData.address !== undefined && customerData.address !== null) {
      if (customerData.address.trim().length === 0) {
        customerData.address = null; // Convert empty string to null
      } else if (customerData.address.length > 200) {
        errors.push('Address must be less than 200 characters');
      }
    }

    // isActive validation
    if (customerData.isActive !== undefined && typeof customerData.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new CustomerService();