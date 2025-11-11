const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Category model for database operations
 */
class CategoryModel {
  /**
   * Find category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null
   */
  async findById(categoryId) {
    try {
      return await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find category: ${error.message}`);
    }
  }

  /**
   * Find category by name
   * @param {string} name - Category name
   * @returns {Promise<Object|null>} Category object or null
   */
  async findByName(name) {
    try {
      return await prisma.category.findUnique({
        where: { name: name.toLowerCase() }
      });
    } catch (error) {
      throw new Error(`Failed to find category by name: ${error.message}`);
    }
  }

  /**
   * Get all categories with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of categories per page
   * @param {boolean} includeInactive - Whether to include inactive categories
   * @returns {Promise<Object>} Paginated categories result
   */
  async findAll(page = 1, limit = 10, includeInactive = false) {
    try {
      const skip = (page - 1) * limit;

      const where = includeInactive ? {} : { isActive: true };

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { products: true }
            }
          },
          orderBy: { name: 'asc' }
        }),
        prisma.category.count({ where })
      ]);

      return {
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async create(categoryData) {
    try {
      const category = await prisma.category.create({
        data: {
          name: categoryData.name.toLowerCase(),
          description: categoryData.description
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return category;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Category with this name already exists');
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  /**
   * Update category by ID
   * @param {string} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  async updateById(categoryId, updateData) {
    try {
      // Handle name update with uniqueness check
      if (updateData.name) {
        const existingCategory = await this.findByName(updateData.name);
        if (existingCategory && existingCategory.id !== categoryId) {
          throw new Error('Category with this name already exists');
        }
        updateData.name = updateData.name.toLowerCase();
      }

      const category = await prisma.category.update({
        where: { id: categoryId },
        data: updateData,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return category;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Category not found');
      }
      if (error.message.includes('already exists')) {
        throw error; // Re-throw our custom error
      }
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  /**
   * Delete category by ID (soft delete)
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Deleted category
   */
  async deleteById(categoryId) {
    try {
      // Check if category has products
      const category = await this.findById(categoryId);
      if (category._count.products > 0) {
        throw new Error('Cannot delete category with associated products');
      }

      const deletedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { isActive: false },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return deletedCategory;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Category not found');
      }
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Get categories with product counts
   * @returns {Promise<Array>} Array of categories with product counts
   */
  async getCategoriesWithProductCounts() {
    try {
      return await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to get categories with product counts: ${error.message}`);
    }
  }
}

module.exports = new CategoryModel();