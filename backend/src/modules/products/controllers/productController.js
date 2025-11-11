const productService = require('../services/productService');

/**
 * Product controller for handling product-related HTTP requests
 */
class ProductController {
  /**
   * Get all products with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllProducts(req, res, next) {
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
      if (req.query.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query.supplierId) filters.supplierId = req.query.supplierId;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.includeInactive === 'true') filters.includeInactive = true;
      if (req.query.lowStock === 'true') filters.lowStock = true;

      const result = await productService.getAllProducts(page, limit, filters);

      res.status(200).json({
        message: 'Products retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProductById(req, res, next) {
    try {
      const { productId } = req.params;

      const product = await productService.getProductById(productId);

      res.status(200).json({
        message: 'Product retrieved successfully',
        product
      });
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createProduct(req, res, next) {
    try {
      const productData = req.body;

      // Validate product data
      productService.validateProductData(productData);

      const product = await productService.createProduct(productData);

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Invalid category or supplier ID') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update product by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProductById(req, res, next) {
    try {
      const { productId } = req.params;
      const updateData = req.body;

      // Validate update data
      productService.validateProductData(updateData, true);

      const product = await productService.updateProductById(productId, updateData);

      res.status(200).json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Product not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      if (error.message === 'Invalid category or supplier ID') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update product stock
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProductStock(req, res, next) {
    try {
      const { productId } = req.params;
      const { quantity, operation } = req.body;

      // Validate input
      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Quantity must be a positive number'
        });
      }

      if (operation && !['add', 'subtract'].includes(operation)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Operation must be either "add" or "subtract"'
        });
      }

      const product = await productService.updateProductStock(productId, quantity, operation || 'add');

      res.status(200).json({
        message: `Product stock ${operation || 'add'}ed successfully`,
        product
      });
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Insufficient stock') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete product by ID (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteProductById(req, res, next) {
    try {
      const { productId } = req.params;

      const product = await productService.deleteProductById(productId);

      res.status(200).json({
        message: 'Product deleted successfully',
        product
      });
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get low stock products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getLowStockProducts(req, res, next) {
    try {
      const products = await productService.getLowStockProducts();

      res.status(200).json({
        message: 'Low stock products retrieved successfully',
        products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();