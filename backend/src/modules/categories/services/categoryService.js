const categoryModel = require('../models/categoryModel');

/**
 * Category service for business logic
 */
class CategoryService {
  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Category object
   */
  async getCategoryById(categoryId) {
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  /**
   * Get all categories with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {boolean} includeInactive - Whether to include inactive categories
   * @returns {Promise<Object>} Paginated categories
   */
  async getAllCategories(page = 1, limit = 10, includeInactive = false) {
    return await categoryModel.findAll(page, limit, includeInactive);
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    // Check if category with same name already exists
    const existingCategory = await categoryModel.findByName(categoryData.name);
    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }

    return await categoryModel.create(categoryData);
  }

  /**
   * Update category by ID
   * @param {string} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  async updateCategoryById(categoryId, updateData) {
    return await categoryModel.updateById(categoryId, updateData);
  }

  /**
   * Delete category by ID (soft delete)
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Deleted category
   */
  async deleteCategoryById(categoryId) {
    return await categoryModel.deleteById(categoryId);
  }

  /**
   * Get categories with product counts
   * @returns {Promise<Array>} Array of categories with product counts
   */
  async getCategoriesWithProductCounts() {
    return await categoryModel.getCategoriesWithProductCounts();
  }

  /**
   * Validate category data
   * @param {Object} categoryData - Category data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateCategoryData(categoryData, isUpdate = false) {
    const errors = [];

    // Name validation
    if (!isUpdate || categoryData.name !== undefined) {
      if (!categoryData.name || categoryData.name.trim().length === 0) {
        errors.push('Category name is required');
      } else if (categoryData.name.length > 50) {
        errors.push('Category name must be less than 50 characters');
      }
    }

    // Description validation (optional)
    if (categoryData.description !== undefined && categoryData.description !== null) {
      if (categoryData.description.length > 200) {
        errors.push('Description must be less than 200 characters');
      }
    }

    // isActive validation
    if (categoryData.isActive !== undefined && typeof categoryData.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new CategoryService();