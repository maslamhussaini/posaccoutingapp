const purchaseModel = require('../models/purchaseModel');
const productModel = require('../../products/models/productModel');
const supplierModel = require('../../suppliers/models/supplierModel');

/**
 * Purchase service for business logic
 */
class PurchaseService {
  /**
   * Get purchase by ID
   * @param {string} purchaseId - Purchase ID
   * @returns {Promise<Object>} Purchase object
   */
  async getPurchaseById(purchaseId) {
    const purchase = await purchaseModel.findById(purchaseId);

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    return purchase;
  }

  /**
   * Get all purchases with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated purchases
   */
  async getAllPurchases(page = 1, limit = 10, filters = {}) {
    return await purchaseModel.findAll(page, limit, filters);
  }

  /**
   * Create a new purchase
   * @param {Object} purchaseData - Purchase data
   * @param {string} userId - User ID creating the purchase
   * @returns {Promise<Object>} Created purchase
   */
  async createPurchase(purchaseData, userId) {
    // Validate purchase data
    this.validatePurchaseData(purchaseData);

    // Validate supplier exists
    const supplier = await supplierModel.findById(purchaseData.supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Validate all products exist and calculate totals
    let total = 0;
    for (const item of purchaseData.items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for product ${product.name}`);
      }

      if (item.unitPrice <= 0) {
        throw new Error(`Invalid unit price for product ${product.name}`);
      }

      total += item.quantity * item.unitPrice;
    }

    const purchase = await purchaseModel.create({
      ...purchaseData,
      userId,
      total
    });

    return purchase;
  }

  /**
   * Update purchase by ID
   * @param {string} purchaseId - Purchase ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated purchase
   */
  async updatePurchaseById(purchaseId, updateData) {
    // Get existing purchase
    const existingPurchase = await this.getPurchaseById(purchaseId);

    // Only allow updates for pending purchases
    if (existingPurchase.status !== 'PENDING') {
      throw new Error('Only pending purchases can be updated');
    }

    // Validate update data
    this.validatePurchaseData(updateData, true);

    // Validate supplier if being updated
    if (updateData.supplierId) {
      const supplier = await supplierModel.findById(updateData.supplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
    }

    // Validate items if being updated
    if (updateData.items) {
      for (const item of updateData.items) {
        const product = await productModel.findById(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for product ${product.name}`);
        }

        if (item.unitPrice <= 0) {
          throw new Error(`Invalid unit price for product ${product.name}`);
        }
      }
    }

    return await purchaseModel.updateById(purchaseId, updateData);
  }

  /**
   * Complete a purchase (update stock and create journal entries)
   * @param {string} purchaseId - Purchase ID
   * @returns {Promise<Object>} Completed purchase
   */
  async completePurchase(purchaseId) {
    const purchase = await this.getPurchaseById(purchaseId);

    if (purchase.status !== 'PENDING') {
      throw new Error('Only pending purchases can be completed');
    }

    // Update product stock for each item
    for (const item of purchase.items) {
      await productModel.updateStock(item.productId, item.quantity, 'add');
    }

    // Update purchase status to completed
    const completedPurchase = await purchaseModel.updateStatus(purchaseId, 'COMPLETED');

    // TODO: Create journal entries for accounting
    // This would typically involve:
    // - Debit: Inventory (Asset)
    // - Credit: Accounts Payable (Liability)

    return completedPurchase;
  }

  /**
   * Cancel a purchase
   * @param {string} purchaseId - Purchase ID
   * @returns {Promise<Object>} Cancelled purchase
   */
  async cancelPurchase(purchaseId) {
    const purchase = await this.getPurchaseById(purchaseId);

    if (purchase.status !== 'PENDING') {
      throw new Error('Only pending purchases can be cancelled');
    }

    return await purchaseModel.updateStatus(purchaseId, 'CANCELLED');
  }

  /**
   * Delete purchase by ID
   * @param {string} purchaseId - Purchase ID
   * @returns {Promise<Object>} Deleted purchase
   */
  async deletePurchaseById(purchaseId) {
    return await purchaseModel.deleteById(purchaseId);
  }

  /**
   * Get purchase statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Purchase statistics
   */
  async getPurchaseStats(filters = {}) {
    return await purchaseModel.getPurchaseStats(filters);
  }

  /**
   * Validate purchase data
   * @param {Object} purchaseData - Purchase data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validatePurchaseData(purchaseData, isUpdate = false) {
    const errors = [];

    // Supplier ID validation
    if (!isUpdate || purchaseData.supplierId !== undefined) {
      if (!purchaseData.supplierId || purchaseData.supplierId.trim().length === 0) {
        errors.push('Supplier ID is required');
      }
    }

    // Items validation
    if (!isUpdate || purchaseData.items !== undefined) {
      if (!purchaseData.items || !Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
        errors.push('At least one item is required');
      } else {
        purchaseData.items.forEach((item, index) => {
          if (!item.productId || item.productId.trim().length === 0) {
            errors.push(`Item ${index + 1}: Product ID is required`);
          }
          if (item.quantity === undefined || item.quantity === null || item.quantity <= 0) {
            errors.push(`Item ${index + 1}: Quantity must be a positive number`);
          }
          if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice <= 0) {
            errors.push(`Item ${index + 1}: Unit price must be a positive number`);
          }
        });
      }
    }

    // Status validation (only for updates)
    if (isUpdate && purchaseData.status !== undefined) {
      const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(purchaseData.status)) {
        errors.push('Invalid status value');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get purchases by supplier
   * @param {string} supplierId - Supplier ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated purchases for supplier
   */
  async getPurchasesBySupplier(supplierId, page = 1, limit = 10) {
    // Validate supplier exists
    const supplier = await supplierModel.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return await this.getAllPurchases(page, limit, { supplierId });
  }

  /**
   * Get purchases by user
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated purchases by user
   */
  async getPurchasesByUser(userId, page = 1, limit = 10) {
    return await this.getAllPurchases(page, limit, { userId });
  }
}

module.exports = new PurchaseService();