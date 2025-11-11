const returnModel = require('../models/returnModel');
const saleModel = require('../../sales/models/saleModel');
const productModel = require('../../products/models/productModel');
const journalService = require('../../journal/services/journalService');

/**
 * Return service for business logic
 */
class ReturnService {
  /**
   * Get return by ID
   * @param {string} returnId - Return ID
   * @returns {Promise<Object>} Return object
   */
  async getReturnById(returnId) {
    const returnObj = await returnModel.findById(returnId);

    if (!returnObj) {
      throw new Error('Return not found');
    }

    return returnObj;
  }

  /**
   * Get all returns with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated returns
   */
  async getAllReturns(page = 1, limit = 10, filters = {}) {
    return await returnModel.findAll(page, limit, filters);
  }

  /**
   * Create a new return with processing functionality
   * @param {Object} returnData - Return data
   * @returns {Promise<Object>} Created return with processing info
   */
  async createReturn(returnData) {
    const { saleId, items, userId, reason, refundType = 'refund' } = returnData;

    // Validate sale exists and is completed
    const sale = await saleModel.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    if (sale.status !== 'COMPLETED') {
      throw new Error('Can only return completed sales');
    }

    // Validate return items against sale items
    const processedItems = [];
    let totalReturnValue = 0;

    for (const returnItem of items) {
      // Find the corresponding sale item
      const saleItem = sale.items.find(item => item.productId === returnItem.productId);
      if (!saleItem) {
        throw new Error(`Product ${returnItem.productId} was not part of this sale`);
      }

      // Check return quantity doesn't exceed sold quantity
      if (returnItem.quantity > saleItem.quantity) {
        throw new Error(`Cannot return more than ${saleItem.quantity} units of product ${returnItem.productId}`);
      }

      // Check if product still exists and is active
      const product = await productModel.findById(returnItem.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product ${returnItem.productId} is no longer available`);
      }

      const unitPrice = returnItem.unitPrice || saleItem.unitPrice;
      const itemTotal = returnItem.quantity * unitPrice;
      totalReturnValue += itemTotal;

      processedItems.push({
        productId: returnItem.productId,
        quantity: returnItem.quantity,
        unitPrice,
        total: itemTotal
      });
    }

    // Create return transaction
    const returnObj = await returnModel.create({
      saleId,
      userId,
      reason,
      total: totalReturnValue,
      items: processedItems
    });

    // Process the return based on type
    if (refundType === 'refund') {
      await this.processRefund(returnObj, sale);
    } else if (refundType === 'exchange') {
      await this.processExchange(returnObj, sale);
    }

    return returnObj;
  }

  /**
   * Process refund for a return
   * @param {Object} returnObj - Return object
   * @param {Object} sale - Original sale object
   * @returns {Promise<void>}
   */
  async processRefund(returnObj, sale) {
    // Update product stock (add back to inventory)
    await returnModel.updateProductStock(returnObj.items);

    // Create journal entries to reverse the sale
    try {
      await journalService.createReturnJournalEntries(returnObj.id, returnObj.total, sale.paymentMethod, returnObj.userId);
    } catch (journalError) {
      console.error('Failed to create journal entries for return:', journalError);
      // Don't fail the return if journal entry creation fails
    }
  }

  /**
   * Process exchange for a return
   * @param {Object} returnObj - Return object
   * @param {Object} sale - Original sale object
   * @returns {Promise<void>}
   */
  async processExchange(returnObj, sale) {
    // For exchange, we still return items to inventory but don't create refund journal entries
    // The exchange will be handled separately when new items are sold
    await returnModel.updateProductStock(returnObj.items);

    // Mark the return as processed for exchange
    await this.updateReturnStatus(returnObj.id, 'COMPLETED');
  }

  /**
   * Update return status
   * @param {string} returnId - Return ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated return
   */
  async updateReturnStatus(returnId, status) {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid return status');
    }

    return await returnModel.updateStatus(returnId, status);
  }

  /**
   * Approve a return request
   * @param {string} returnId - Return ID
   * @returns {Promise<Object>} Updated return
   */
  async approveReturn(returnId) {
    const returnObj = await this.getReturnById(returnId);

    if (returnObj.status !== 'PENDING') {
      throw new Error('Return is not in pending status');
    }

    // Get the original sale
    const sale = await saleModel.findById(returnObj.saleId);

    // Process the refund
    await this.processRefund(returnObj, sale);

    // Update return status
    return await this.updateReturnStatus(returnId, 'APPROVED');
  }

  /**
   * Reject a return request
   * @param {string} returnId - Return ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated return
   */
  async rejectReturn(returnId, reason) {
    const returnObj = await this.getReturnById(returnId);

    if (returnObj.status !== 'PENDING') {
      throw new Error('Return is not in pending status');
    }

    // Update return status to rejected
    const updatedReturn = await this.updateReturnStatus(returnId, 'REJECTED');

    // Could add rejection reason to the return record if schema supports it
    return updatedReturn;
  }

  /**
   * Get returns statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Returns statistics
   */
  async getReturnsStats(filters = {}) {
    return await returnModel.getReturnsStats(filters);
  }

  /**
   * Calculate refund amount for return items
   * @param {Array} items - Return items
   * @param {Object} sale - Original sale
   * @returns {Promise<number>} Calculated refund amount
   */
  async calculateRefundAmount(items, sale) {
    let totalRefund = 0;

    for (const returnItem of items) {
      const saleItem = sale.items.find(item => item.productId === returnItem.productId);
      if (saleItem) {
        // Use the original sale price or specified return price
        const unitPrice = returnItem.unitPrice || saleItem.unitPrice;
        totalRefund += returnItem.quantity * unitPrice;
      }
    }

    return totalRefund;
  }

  /**
   * Validate return data
   * @param {Object} returnData - Return data to validate
   */
  validateReturnData(returnData) {
    const errors = [];

    // Sale ID validation
    if (!returnData.saleId) {
      errors.push('Sale ID is required');
    }

    // Items validation
    if (!returnData.items || !Array.isArray(returnData.items) || returnData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      returnData.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`Item ${index + 1}: Product ID is required`);
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be a positive number`);
        }
        if (item.unitPrice !== undefined && (typeof item.unitPrice !== 'number' || item.unitPrice < 0)) {
          errors.push(`Item ${index + 1}: Unit price must be a non-negative number`);
        }
      });
    }

    // User ID validation
    if (!returnData.userId) {
      errors.push('User ID is required');
    }

    // Refund type validation
    if (returnData.refundType && !['refund', 'exchange'].includes(returnData.refundType)) {
      errors.push('Refund type must be "refund" or "exchange"');
    }

    // Reason validation (optional but recommended)
    if (returnData.reason && returnData.reason.length > 500) {
      errors.push('Reason must be less than 500 characters');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new ReturnService();