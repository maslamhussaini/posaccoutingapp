const supplierModel = require('../models/supplierModel');

/**
 * Supplier service for business logic
 */
class SupplierService {
  /**
   * Get supplier by ID
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<Object>} Supplier object
   */
  async getSupplierById(supplierId) {
    const supplier = await supplierModel.findById(supplierId);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier;
  }

  /**
   * Get all suppliers with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {boolean} includeInactive - Whether to include inactive suppliers
   * @returns {Promise<Object>} Paginated suppliers
   */
  async getAllSuppliers(page = 1, limit = 10, includeInactive = false) {
    return await supplierModel.findAll(page, limit, includeInactive);
  }

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier data
   * @returns {Promise<Object>} Created supplier
   */
  async createSupplier(supplierData) {
    // Check if supplier with same email already exists
    if (supplierData.email) {
      const existingSupplier = await supplierModel.findByEmail(supplierData.email);
      if (existingSupplier) {
        throw new Error('Supplier with this email already exists');
      }
    }

    return await supplierModel.create(supplierData);
  }

  /**
   * Update supplier by ID
   * @param {string} supplierId - Supplier ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated supplier
   */
  async updateSupplierById(supplierId, updateData) {
    return await supplierModel.updateById(supplierId, updateData);
  }

  /**
   * Delete supplier by ID (soft delete)
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<Object>} Deleted supplier
   */
  async deleteSupplierById(supplierId) {
    return await supplierModel.deleteById(supplierId);
  }

  /**
   * Get suppliers with product counts
   * @returns {Promise<Array>} Array of suppliers with product counts
   */
  async getSuppliersWithProductCounts() {
    return await supplierModel.getSuppliersWithProductCounts();
  }

  /**
   * Validate supplier data
   * @param {Object} supplierData - Supplier data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateSupplierData(supplierData, isUpdate = false) {
    const errors = [];

    // Name validation
    if (!isUpdate || supplierData.name !== undefined) {
      if (!supplierData.name || supplierData.name.trim().length === 0) {
        errors.push('Supplier name is required');
      } else if (supplierData.name.length > 100) {
        errors.push('Supplier name must be less than 100 characters');
      }
    }

    // Email validation (optional)
    if (supplierData.email !== undefined && supplierData.email !== null) {
      if (supplierData.email.trim().length === 0) {
        supplierData.email = null; // Convert empty string to null
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(supplierData.email)) {
          errors.push('Invalid email format');
        } else if (supplierData.email.length > 100) {
          errors.push('Email must be less than 100 characters');
        }
      }
    }

    // Phone validation (optional)
    if (supplierData.phone !== undefined && supplierData.phone !== null) {
      if (supplierData.phone.trim().length === 0) {
        supplierData.phone = null; // Convert empty string to null
      } else if (supplierData.phone.length > 20) {
        errors.push('Phone number must be less than 20 characters');
      }
    }

    // Address validation (optional)
    if (supplierData.address !== undefined && supplierData.address !== null) {
      if (supplierData.address.trim().length === 0) {
        supplierData.address = null; // Convert empty string to null
      } else if (supplierData.address.length > 200) {
        errors.push('Address must be less than 200 characters');
      }
    }

    // isActive validation
    if (supplierData.isActive !== undefined && typeof supplierData.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new SupplierService();