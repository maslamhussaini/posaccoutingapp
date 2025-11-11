const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Return model for database operations
 */
class ReturnModel {
  /**
   * Find return by ID with relations
   * @param {string} returnId - Return ID
   * @returns {Promise<Object|null>} Return object or null
   */
  async findById(returnId) {
    try {
      return await prisma.return.findUnique({
        where: { id: returnId },
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
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
      throw new Error(`Failed to find return: ${error.message}`);
    }
  }

  /**
   * Get all returns with pagination and filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of returns per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated returns result
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (filters.saleId) {
        where.saleId = filters.saleId;
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

      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          skip,
          take: limit,
          include: {
            sale: {
              select: {
                id: true,
                total: true,
                customer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
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
        prisma.return.count({ where })
      ]);

      return {
        returns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch returns: ${error.message}`);
    }
  }

  /**
   * Create a new return with items
   * @param {Object} returnData - Return data including items
   * @returns {Promise<Object>} Created return
   */
  async create(returnData) {
    try {
      const { items, ...returnFields } = returnData;

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

      const returnObj = await prisma.return.create({
        data: {
          ...returnFields,
          total: subtotal,
          items: {
            create: processedItems
          }
        },
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
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

      return returnObj;
    } catch (error) {
      if (error.code === 'P2003') {
        throw new Error('Invalid sale, user, or product ID');
      }
      throw new Error(`Failed to create return: ${error.message}`);
    }
  }

  /**
   * Update return status
   * @param {string} returnId - Return ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated return
   */
  async updateStatus(returnId, status) {
    try {
      const returnObj = await prisma.return.update({
        where: { id: returnId },
        data: { status },
        include: {
          sale: {
            select: {
              id: true,
              total: true
            }
          },
          items: true
        }
      });

      return returnObj;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Return not found');
      }
      throw new Error(`Failed to update return status: ${error.message}`);
    }
  }

  /**
   * Get returns statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Returns statistics
   */
  async getReturnsStats(filters = {}) {
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

      const stats = await prisma.return.aggregate({
        where,
        _count: {
          id: true
        },
        _sum: {
          total: true
        }
      });

      return {
        totalReturns: stats._count.id,
        totalReturnValue: stats._sum.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to get returns stats: ${error.message}`);
    }
  }

  /**
   * Update product stock after return (add back to inventory)
   * @param {Array} items - Return items
   * @returns {Promise<void>}
   */
  async updateProductStock(items) {
    try {
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to update product stock: ${error.message}`);
    }
  }
}

module.exports = new ReturnModel();