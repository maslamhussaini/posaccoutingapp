const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CashRegister model for database operations
 */
class CashRegisterModel {
  /**
   * Find cash register by ID
   * @param {string} registerId - Cash register ID
   * @returns {Promise<Object|null>} Cash register object or null
   */
  async findById(registerId) {
    try {
      return await prisma.cashRegister.findUnique({
        where: { id: registerId },
        include: {
          openedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          closedBy: {
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
      throw new Error(`Failed to find cash register: ${error.message}`);
    }
  }

  /**
   * Get all cash registers
   * @returns {Promise<Array>} Array of cash registers
   */
  async findAll() {
    try {
      return await prisma.cashRegister.findMany({
        include: {
          openedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          closedBy: {
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
      throw new Error(`Failed to fetch cash registers: ${error.message}`);
    }
  }

  /**
   * Create a new cash register
   * @param {Object} registerData - Cash register data
   * @returns {Promise<Object>} Created cash register
   */
  async create(registerData) {
    try {
      const cashRegister = await prisma.cashRegister.create({
        data: registerData,
        include: {
          openedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          closedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return cashRegister;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Cash register with this name already exists');
      }
      throw new Error(`Failed to create cash register: ${error.message}`);
    }
  }

  /**
   * Update cash register by ID
   * @param {string} registerId - Cash register ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated cash register
   */
  async updateById(registerId, updateData) {
    try {
      const cashRegister = await prisma.cashRegister.update({
        where: { id: registerId },
        data: updateData,
        include: {
          openedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          closedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return cashRegister;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Cash register not found');
      }
      if (error.code === 'P2002') {
        throw new Error('Cash register with this name already exists');
      }
      throw new Error(`Failed to update cash register: ${error.message}`);
    }
  }

  /**
   * Delete cash register by ID
   * @param {string} registerId - Cash register ID
   * @returns {Promise<Object>} Deleted cash register
   */
  async deleteById(registerId) {
    try {
      const cashRegister = await prisma.cashRegister.delete({
        where: { id: registerId }
      });

      return cashRegister;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Cash register not found');
      }
      throw new Error(`Failed to delete cash register: ${error.message}`);
    }
  }

  /**
   * Find open cash register by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Open cash register or null
   */
  async findOpenByUserId(userId) {
    try {
      return await prisma.cashRegister.findFirst({
        where: {
          openedById: userId,
          isOpen: true
        },
        include: {
          openedBy: {
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
      throw new Error(`Failed to find open cash register: ${error.message}`);
    }
  }

  /**
   * Get cash registers with movements for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Cash registers with movements
   */
  async getWithMovements(startDate, endDate) {
    try {
      return await prisma.cashRegister.findMany({
        where: {
          OR: [
            {
              openedAt: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              closedAt: {
                gte: startDate,
                lte: endDate
              }
            }
          ]
        },
        include: {
          openedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          closedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          movements: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            },
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
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { openedAt: 'desc' }
      });
    } catch (error) {
      throw new Error(`Failed to fetch cash registers with movements: ${error.message}`);
    }
  }
}

module.exports = new CashRegisterModel();