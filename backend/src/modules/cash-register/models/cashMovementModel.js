const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CashMovement model for database operations
 */
class CashMovementModel {
  /**
   * Find cash movement by ID
   * @param {string} movementId - Cash movement ID
   * @returns {Promise<Object|null>} Cash movement object or null
   */
  async findById(movementId) {
    try {
      return await prisma.cashMovement.findUnique({
        where: { id: movementId },
        include: {
          cashRegister: {
            select: {
              id: true,
              name: true,
              isOpen: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find cash movement: ${error.message}`);
    }
  }

  /**
   * Get all cash movements for a cash register
   * @param {string} registerId - Cash register ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of movements per page
   * @returns {Promise<Object>} Paginated cash movements result
   */
  async findByRegisterId(registerId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const [movements, total] = await Promise.all([
        prisma.cashMovement.findMany({
          where: { cashRegisterId: registerId },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.cashMovement.count({
          where: { cashRegisterId: registerId }
        })
      ]);

      return {
        movements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch cash movements: ${error.message}`);
    }
  }

  /**
   * Create a new cash movement
   * @param {Object} movementData - Cash movement data
   * @returns {Promise<Object>} Created cash movement
   */
  async create(movementData) {
    try {
      const movement = await prisma.cashMovement.create({
        data: movementData,
        include: {
          cashRegister: {
            select: {
              id: true,
              name: true,
              isOpen: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return movement;
    } catch (error) {
      throw new Error(`Failed to create cash movement: ${error.message}`);
    }
  }

  /**
   * Get cash movements by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} registerId - Optional cash register ID filter
   * @returns {Promise<Array>} Array of cash movements
   */
  async findByDateRange(startDate, endDate, registerId = null) {
    try {
      const where = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (registerId) {
        where.cashRegisterId = registerId;
      }

      return await prisma.cashMovement.findMany({
        where,
        include: {
          cashRegister: {
            select: {
              id: true,
              name: true,
              isOpen: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch cash movements by date range: ${error.message}`);
    }
  }

  /**
   * Get cash movements by type
   * @param {string} type - Movement type
   * @param {string} registerId - Optional cash register ID filter
   * @returns {Promise<Array>} Array of cash movements
   */
  async findByType(type, registerId = null) {
    try {
      const where = { type };

      if (registerId) {
        where.cashRegisterId = registerId;
      }

      return await prisma.cashMovement.findMany({
        where,
        include: {
          cashRegister: {
            select: {
              id: true,
              name: true,
              isOpen: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch cash movements by type: ${error.message}`);
    }
  }

  /**
   * Calculate total movements by type for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} registerId - Optional cash register ID filter
   * @returns {Promise<Object>} Totals by movement type
   */
  async getTotalsByType(startDate, endDate, registerId = null) {
    try {
      const where = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (registerId) {
        where.cashRegisterId = registerId;
      }

      const movements = await prisma.cashMovement.groupBy({
        by: ['type'],
        where,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      // Convert to more readable format
      const totals = {};
      movements.forEach(movement => {
        totals[movement.type] = {
          total: movement._sum.amount || 0,
          count: movement._count.id
        };
      });

      return totals;
    } catch (error) {
      throw new Error(`Failed to calculate movement totals: ${error.message}`);
    }
  }

  /**
   * Delete cash movement by ID
   * @param {string} movementId - Cash movement ID
   * @returns {Promise<Object>} Deleted cash movement
   */
  async deleteById(movementId) {
    try {
      const movement = await prisma.cashMovement.delete({
        where: { id: movementId }
      });

      return movement;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Cash movement not found');
      }
      throw new Error(`Failed to delete cash movement: ${error.message}`);
    }
  }
}

module.exports = new CashMovementModel();