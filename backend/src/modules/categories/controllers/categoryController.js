const categoryService = require('../services/categoryService');

/**
 * Category controller for handling category-related HTTP requests
 */
class CategoryController {
  /**
   * Get all categories with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCategories(req, res, next) {
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

      const result = await categoryService.getAllCategories(page, limit, includeInactive);

      res.status(200).json({
        message: 'Categories retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoryById(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await categoryService.getCategoryById(categoryId);

      res.status(200).json({
        message: 'Category retrieved successfully',
        category
      });
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;

      // Validate category data
      categoryService.validateCategoryData(categoryData);

      const category = await categoryService.createCategory(categoryData);

      res.status(201).json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Category with this name already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCategoryById(req, res, next) {
    try {
      const { categoryId } = req.params;
      const updateData = req.body;

      // Validate update data
      categoryService.validateCategoryData(updateData, true);

      const category = await categoryService.updateCategoryById(categoryId, updateData);

      res.status(200).json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'Category not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Category with this name already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete category by ID (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCategoryById(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await categoryService.deleteCategoryById(categoryId);

      res.status(200).json({
        message: 'Category deleted successfully',
        category
      });
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'Cannot delete category with associated products') {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get categories with product counts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoriesWithProductCounts(req, res, next) {
    try {
      const categories = await categoryService.getCategoriesWithProductCounts();

      res.status(200).json({
        message: 'Categories with product counts retrieved successfully',
        categories
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();