const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Product model for database operations
 */
class ProductModel {
  /**
   * Find product by ID with relations
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product object or null
   */
  async findById(productId) {
    try {
      return await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find product: ${error.message}`);
    }
  }

  /**
   * Find product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<Object|null>} Product object or null
   */
  async findBySku(sku) {
    try {
      return await prisma.product.findUnique({
        where: { sku }
      });
    } catch (error) {
      throw new Error(`Failed to find product by SKU: ${error.message}`);
    }
  }

  /**
   * Find product by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object|null>} Product object or null
   */
  async findByBarcode(barcode) {
    try {
      return await prisma.product.findUnique({
        where: { barcode }
      });
    } catch (error) {
      throw new Error(`Failed to find product by barcode: ${error.message}`);
    }
  }

  /**
   * Get all products with pagination and filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of products per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated products result
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {
        isActive: filters.includeInactive !== true
      };

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.lowStock === true) {
        where.stock = {
          lte: prisma.product.fields.minStock
        };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async create(productData) {
    try {
      const product = await prisma.product.create({
        data: productData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return product;
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new Error(`Product with this ${field} already exists`);
      }
      if (error.code === 'P2003') {
        throw new Error('Invalid category or supplier ID');
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Update product by ID
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product
   */
  async updateById(productId, updateData) {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return product;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Product not found');
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new Error(`Product with this ${field} already exists`);
      }
      if (error.code === 'P2003') {
        throw new Error('Invalid category or supplier ID');
      }
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Update product stock
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add/subtract
   * @param {string} operation - 'add' or 'subtract'
   * @returns {Promise<Object>} Updated product
   */
  async updateStock(productId, quantity, operation = 'add') {
    try {
      const product = await this.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let newStock;
      if (operation === 'subtract') {
        newStock = product.stock - quantity;
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
      } else {
        newStock = product.stock + quantity;
      }

      return await this.updateById(productId, { stock: newStock });
    } catch (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }

  /**
   * Delete product by ID (soft delete)
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Deleted product
   */
  async deleteById(productId) {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return product;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Product not found');
      }
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Get low stock products
   * @returns {Promise<Array>} Array of low stock products
   */
  async getLowStockProducts() {
    try {
      return await prisma.product.findMany({
        where: {
          isActive: true,
          stock: {
            lte: prisma.product.fields.minStock
          }
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { stock: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to get low stock products: ${error.message}`);
    }
  }
}

module.exports = new ProductModel();