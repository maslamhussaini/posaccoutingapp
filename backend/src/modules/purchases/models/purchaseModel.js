const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Purchase model for database operations
 */
class PurchaseModel {
  /**
   * Find purchase by ID with relations
   * @param {string} purchaseId - Purchase ID
   * @returns {Promise<Object|null>} Purchase object or null
   */
  async findById(purchaseId) {
    try {
      return await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
          supplier: {
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
                  costPrice: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find purchase: ${error.message}`);
    }
  }

  /**
   * Get all purchases with pagination and filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of purchases per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated purchases result
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: limit,
          include: {
            supplier: {
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
        prisma.purchase.count({ where })
      ]);

      return {
        purchases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch purchases: ${error.message}`);
    }
  }

  /**
   * Create a new purchase with items
   * @param {Object} purchaseData - Purchase data including items
   * @returns {Promise<Object>} Created purchase
   */
  async create(purchaseData) {
    try {
      const { items, ...purchaseInfo } = purchaseData;

      // Calculate total from items
      let total = 0;
      if (items && items.length > 0) {
        total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      }

      const purchase = await prisma.purchase.create({
        data: {
          ...purchaseInfo,
          total,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          supplier: {
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
                  costPrice: true
                }
              }
            }
          }
        }
      });

      return purchase;
    } catch (error) {
      if (error.code === 'P2003') {
        throw new Error('Invalid supplier or user ID, or product ID in items');
      }
      throw new Error(`Failed to create purchase: ${error.message}`);
    }
  }

  /**
   * Update purchase by ID
   * @param {string} purchaseId - Purchase ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated purchase
   */
  async updateById(purchaseId, updateData) {
    try {
      const { items, ...purchaseInfo } = updateData;

      let data = { ...purchaseInfo };

      // If items are being updated, recalculate total
      if (items && items.length > 0) {
        const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        data.total = total;

        // Delete existing items and create new ones
        await prisma.purchaseItem.deleteMany({
          where: { purchaseId }
        });

        data.items = {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        };
      }

      const purchase = await prisma.purchase.update({
        where: { id: purchaseId },
        data,
        include: {
          supplier: {
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
                  costPrice: true
                }
              }
            }
          }
        }
      });

      return purchase;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Purchase not found');
      }
      if (error.code === 'P2003') {
        throw new Error('Invalid supplier or user ID, or product ID in items');
      }
      throw new Error(`Failed to update purchase: ${error.message}`);
    }
  }

  /**
   * Update purchase status
   * @param {string} purchaseId - Purchase ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated purchase
   */
  async updateStatus(purchaseId, status) {
    try {
      const purchase = await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status },
        include: {
          supplier: {
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

      return purchase;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Purchase not found');
      }
      throw new Error(`Failed to update purchase status: ${error.message}`);
    }
  }

  /**
   * Delete purchase by ID
   * @param {string} purchaseId - Purchase ID
   * @returns {Promise<Object>} Deleted purchase
   */
  async deleteById(purchaseId) {
    try {
      // Check if purchase can be deleted (only pending purchases)
      const purchase = await this.findById(purchaseId);
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      if (purchase.status !== 'PENDING') {
        throw new Error('Only pending purchases can be deleted');
      }

      // Delete items first due to foreign key constraints
      await prisma.purchaseItem.deleteMany({
        where: { purchaseId }
      });

      const deletedPurchase = await prisma.purchase.delete({
        where: { id: purchaseId }
      });

      return deletedPurchase;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Purchase not found');
      }
      throw new Error(`Failed to delete purchase: ${error.message}`);
    }
  }

  /**
   * Get purchase statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Purchase statistics
   */
  async getPurchaseStats(filters = {}) {
    try {
      const where = {};

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }

      const stats = await prisma.purchase.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        },
        _sum: {
          total: true
        }
      });

      return {
        totalPurchases: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        totalAmount: stats.reduce((sum, stat) => sum + (stat._sum.total || 0), 0),
        byStatus: stats.map(stat => ({
          status: stat.status,
          count: stat._count.id,
          total: stat._sum.total || 0
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get purchase statistics: ${error.message}`);
    }
  }
}

module.exports = new PurchaseModel();