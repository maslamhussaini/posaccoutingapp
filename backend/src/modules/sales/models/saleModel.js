const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sale model for database operations
 */
class SaleModel {
  /**
   * Find sale by ID with relations
   * @param {string} saleId - Sale ID
   * @returns {Promise<Object|null>} Sale object or null
   */
  async findById(saleId) {
    try {
      return await prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  barcode: true,
                  price: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find sale: ${error.message}`);
    }
  }

  /**
   * Get all sales with pagination and filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of sales per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated sales result
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (filters.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate && filters.endDate) {
        where.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          skip,
          take: limit,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.sale.count({ where })
      ]);

      return {
        sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }
  }

  /**
   * Create a new sale with items
   * @param {Object} saleData - Sale data including items
   * @returns {Promise<Object>} Created sale
   */
  async create(saleData) {
    try {
      const { items, ...saleFields } = saleData;

      // Calculate totals
      let subtotal = 0;
      const processedItems = items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotal
        };
      });

      // Apply discount
      const discountAmount = saleFields.discountType === 'percentage'
        ? (subtotal * saleFields.discount) / 100
        : saleFields.discount || 0;

      const total = subtotal - discountAmount + (saleFields.tax || 0);

      const sale = await prisma.sale.create({
        data: {
          ...saleFields,
          total,
          items: {
            create: processedItems
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      return sale;
    } catch (error) {
      if (error.code === 'P2003') {
        throw new Error('Invalid customer, user, or product ID');
      }
      throw new Error(`Failed to create sale: ${error.message}`);
    }
  }

  /**
   * Update sale status
   * @param {string} saleId - Sale ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated sale
   */
  async updateStatus(saleId, status) {
    try {
      const sale = await prisma.sale.update({
        where: { id: saleId },
        data: { status },
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          },
          items: true
        }
      });

      return sale;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Sale not found');
      }
      throw new Error(`Failed to update sale status: ${error.message}`);
    }
  }

  /**
   * Get sales statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Sales statistics
   */
  async getSalesStats(filters = {}) {
    try {
      const where = {};

      if (filters.startDate && filters.endDate) {
        where.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      const stats = await prisma.sale.aggregate({
        where,
        _count: {
          id: true
        },
        _sum: {
          total: true,
          tax: true,
          discount: true
        }
      });

      return {
        totalSales: stats._count.id,
        totalRevenue: stats._sum.total || 0,
        totalTax: stats._sum.tax || 0,
        totalDiscount: stats._sum.discount || 0
      };
    } catch (error) {
      throw new Error(`Failed to get sales stats: ${error.message}`);
    }
  }

  /**
   * Update product stock after sale
   * @param {Array} items - Sale items
   * @returns {Promise<void>}
   */
  async updateProductStock(items) {
    try {
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to update product stock: ${error.message}`);
    }
  }
}

module.exports = new SaleModel();