const saleModel = require('../models/saleModel');
const productModel = require('../../products/models/productModel');
const customerModel = require('../../customers/models/customerModel');
const journalService = require('../../journal/services/journalService');

/**
 * Sale service for business logic
 */
class SaleService {
  /**
   * Get sale by ID
   * @param {string} saleId - Sale ID
   * @returns {Promise<Object>} Sale object
   */
  async getSaleById(saleId) {
    const sale = await saleModel.findById(saleId);

    if (!sale) {
      throw new Error('Sale not found');
    }

    return sale;
  }

  /**
   * Get all sales with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated sales
   */
  async getAllSales(page = 1, limit = 10, filters = {}) {
    return await saleModel.findAll(page, limit, filters);
  }

  /**
   * Create a new sale with POS checkout functionality
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Created sale with payment info
   */
  async createSale(saleData) {
    const { items, customerId, userId, discount = 0, discountType = 'fixed', tax = 0, paymentMethod, paymentAmount } = saleData;

    // Validate customer if provided
    if (customerId) {
      const customer = await customerModel.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Find product by ID, SKU, or barcode
      let product;
      if (item.productId) {
        product = await productModel.findById(item.productId);
      } else if (item.sku) {
        product = await productModel.findBySku(item.sku);
      } else if (item.barcode) {
        product = await productModel.findByBarcode(item.barcode);
      }

      if (!product) {
        throw new Error(`Product not found: ${item.productId || item.sku || item.barcode}`);
      }

      if (!product.isActive) {
        throw new Error(`Product is inactive: ${product.name}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const unitPrice = item.unitPrice || product.price;
      const itemTotal = item.quantity * unitPrice;
      subtotal += itemTotal;

      processedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        total: itemTotal
      });
    }

    // Calculate discount
    const discountAmount = discountType === 'percentage'
      ? (subtotal * discount) / 100
      : discount;

    const total = subtotal - discountAmount + tax;

    // Validate payment
    if (paymentAmount < total) {
      throw new Error(`Payment amount (${paymentAmount}) is less than total (${total})`);
    }

    const change = paymentAmount - total;

    // Create sale transaction
    const sale = await saleModel.create({
      customerId,
      userId,
      total,
      tax,
      discount: discountAmount,
      discountType,
      items: processedItems
    });

    // Update product stock
    await saleModel.updateProductStock(processedItems);

    // Create journal entries for accounting
    try {
      await journalService.createSaleJournalEntries(sale.id, total, paymentMethod, userId);
    } catch (journalError) {
      console.error('Failed to create journal entries for sale:', journalError);
      // Don't fail the sale if journal entry creation fails
    }

    // Return sale with payment info
    return {
      ...sale,
      payment: {
        method: paymentMethod,
        amount: paymentAmount,
        change,
        subtotal,
        discountAmount,
        tax
      }
    };
  }

  /**
   * Process barcode scan for POS
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object>} Product info for POS
   */
  async scanBarcode(barcode) {
    const product = await productModel.findByBarcode(barcode);

    if (!product) {
      throw new Error('Product not found with this barcode');
    }

    if (!product.isActive) {
      throw new Error('Product is inactive');
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      category: product.category
    };
  }

  /**
   * Calculate totals for cart items
   * @param {Array} items - Cart items
   * @param {number} discount - Discount amount
   * @param {string} discountType - 'fixed' or 'percentage'
   * @param {number} tax - Tax amount
   * @returns {Promise<Object>} Calculated totals
   */
  async calculateTotals(items, discount = 0, discountType = 'fixed', tax = 0) {
    let subtotal = 0;

    for (const item of items) {
      let product;
      if (item.productId) {
        product = await productModel.findById(item.productId);
      } else if (item.sku) {
        product = await productModel.findBySku(item.sku);
      } else if (item.barcode) {
        product = await productModel.findByBarcode(item.barcode);
      }

      if (!product) {
        throw new Error(`Product not found: ${item.productId || item.sku || item.barcode}`);
      }

      const unitPrice = item.unitPrice || product.price;
      subtotal += item.quantity * unitPrice;
    }

    const discountAmount = discountType === 'percentage'
      ? (subtotal * discount) / 100
      : discount;

    const total = subtotal - discountAmount + tax;

    return {
      subtotal,
      discountAmount,
      tax,
      total
    };
  }

  /**
   * Update sale status
   * @param {string} saleId - Sale ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated sale
   */
  async updateSaleStatus(saleId, status) {
    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid sale status');
    }

    return await saleModel.updateStatus(saleId, status);
  }

  /**
   * Get sales statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Sales statistics
   */
  async getSalesStats(filters = {}) {
    return await saleModel.getSalesStats(filters);
  }

  /**
   * Validate sale data
   * @param {Object} saleData - Sale data to validate
   */
  validateSaleData(saleData) {
    const errors = [];

    // Items validation
    if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      saleData.items.forEach((item, index) => {
        if (!item.productId && !item.sku && !item.barcode) {
          errors.push(`Item ${index + 1}: Product ID, SKU, or barcode is required`);
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
    if (!saleData.userId) {
      errors.push('User ID is required');
    }

    // Discount validation
    if (saleData.discount !== undefined && (typeof saleData.discount !== 'number' || saleData.discount < 0)) {
      errors.push('Discount must be a non-negative number');
    }

    if (saleData.discountType && !['fixed', 'percentage'].includes(saleData.discountType)) {
      errors.push('Discount type must be "fixed" or "percentage"');
    }

    // Tax validation
    if (saleData.tax !== undefined && (typeof saleData.tax !== 'number' || saleData.tax < 0)) {
      errors.push('Tax must be a non-negative number');
    }

    // Payment validation
    if (!saleData.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (!saleData.paymentAmount || typeof saleData.paymentAmount !== 'number' || saleData.paymentAmount <= 0) {
      errors.push('Payment amount must be a positive number');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new SaleService();