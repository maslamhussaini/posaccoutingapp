const productModel = require('../models/productModel');

/**
 * Product service for business logic
 */
class ProductService {
  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProductById(productId) {
    const product = await productModel.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Get all products with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated products
   */
  async getAllProducts(page = 1, limit = 10, filters = {}) {
    return await productModel.findAll(page, limit, filters);
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    // Validate SKU uniqueness
    if (productData.sku) {
      const existingProduct = await productModel.findBySku(productData.sku);
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }
    }

    // Validate barcode uniqueness if provided
    if (productData.barcode) {
      const existingProduct = await productModel.findByBarcode(productData.barcode);
      if (existingProduct) {
        throw new Error('Product with this barcode already exists');
      }
    }

    return await productModel.create(productData);
  }

  /**
   * Update product by ID
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product
   */
  async updateProductById(productId, updateData) {
    // Validate SKU uniqueness if being updated
    if (updateData.sku) {
      const existingProduct = await productModel.findBySku(updateData.sku);
      if (existingProduct && existingProduct.id !== productId) {
        throw new Error('Product with this SKU already exists');
      }
    }

    // Validate barcode uniqueness if being updated
    if (updateData.barcode) {
      const existingProduct = await productModel.findByBarcode(updateData.barcode);
      if (existingProduct && existingProduct.id !== productId) {
        throw new Error('Product with this barcode already exists');
      }
    }

    return await productModel.updateById(productId, updateData);
  }

  /**
   * Update product stock
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add/subtract
   * @param {string} operation - 'add' or 'subtract'
   * @returns {Promise<Object>} Updated product
   */
  async updateProductStock(productId, quantity, operation = 'add') {
    return await productModel.updateStock(productId, quantity, operation);
  }

  /**
   * Delete product by ID (soft delete)
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Deleted product
   */
  async deleteProductById(productId) {
    return await productModel.deleteById(productId);
  }

  /**
   * Get low stock products
   * @returns {Promise<Array>} Array of low stock products
   */
  async getLowStockProducts() {
    return await productModel.getLowStockProducts();
  }

  /**
   * Validate product data
   * @param {Object} productData - Product data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateProductData(productData, isUpdate = false) {
    const errors = [];

    // Name validation
    if (!isUpdate || productData.name !== undefined) {
      if (!productData.name || productData.name.trim().length === 0) {
        errors.push('Product name is required');
      } else if (productData.name.length > 100) {
        errors.push('Product name must be less than 100 characters');
      }
    }

    // SKU validation
    if (!isUpdate || productData.sku !== undefined) {
      if (!productData.sku || productData.sku.trim().length === 0) {
        errors.push('SKU is required');
      } else if (productData.sku.length > 50) {
        errors.push('SKU must be less than 50 characters');
      }
    }

    // Price validation
    if (!isUpdate || productData.price !== undefined) {
      if (productData.price === undefined || productData.price === null) {
        errors.push('Price is required');
      } else if (typeof productData.price !== 'number' || productData.price < 0) {
        errors.push('Price must be a positive number');
      }
    }

    // Cost price validation
    if (!isUpdate || productData.costPrice !== undefined) {
      if (productData.costPrice === undefined || productData.costPrice === null) {
        errors.push('Cost price is required');
      } else if (typeof productData.costPrice !== 'number' || productData.costPrice < 0) {
        errors.push('Cost price must be a positive number');
      }
    }

    // Stock validation
    if (!isUpdate || productData.stock !== undefined) {
      if (productData.stock === undefined || productData.stock === null) {
        if (!isUpdate) {
          productData.stock = 0; // Default to 0 for new products
        }
      } else if (typeof productData.stock !== 'number' || productData.stock < 0) {
        errors.push('Stock must be a non-negative number');
      }
    }

    // Min stock validation
    if (!isUpdate || productData.minStock !== undefined) {
      if (productData.minStock === undefined || productData.minStock === null) {
        if (!isUpdate) {
          productData.minStock = 0; // Default to 0 for new products
        }
      } else if (typeof productData.minStock !== 'number' || productData.minStock < 0) {
        errors.push('Minimum stock must be a non-negative number');
      }
    }

    // Category ID validation
    if (!isUpdate || productData.categoryId !== undefined) {
      if (!productData.categoryId || productData.categoryId.trim().length === 0) {
        errors.push('Category ID is required');
      }
    }

    // Barcode validation (optional)
    if (productData.barcode !== undefined && productData.barcode !== null) {
      if (productData.barcode.length > 50) {
        errors.push('Barcode must be less than 50 characters');
      }
    }

    // Description validation (optional)
    if (productData.description !== undefined && productData.description !== null) {
      if (productData.description.length > 500) {
        errors.push('Description must be less than 500 characters');
      }
    }

    // isActive validation
    if (productData.isActive !== undefined && typeof productData.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new ProductService();