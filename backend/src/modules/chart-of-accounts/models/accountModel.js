const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Account model for database operations
 */
class AccountModel {
  /**
   * Find account by ID with relations
   * @param {string} accountId - Account ID
   * @returns {Promise<Object|null>} Account object or null
   */
  async findById(accountId) {
    try {
      return await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          children: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          debitJournalEntries: {
            select: {
              id: true,
              date: true,
              description: true,
              amount: true
            },
            orderBy: { date: 'desc' },
            take: 5
          },
          creditJournalEntries: {
            select: {
              id: true,
              date: true,
              description: true,
              amount: true
            },
            orderBy: { date: 'desc' },
            take: 5
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find account: ${error.message}`);
    }
  }

  /**
   * Find account by code
   * @param {string} code - Account code
   * @returns {Promise<Object|null>} Account object or null
   */
  async findByCode(code) {
    try {
      return await prisma.account.findUnique({
        where: { code }
      });
    } catch (error) {
      throw new Error(`Failed to find account by code: ${error.message}`);
    }
  }

  /**
   * Get all accounts with pagination and filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of accounts per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated accounts result
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {
        isActive: filters.includeInactive !== true
      };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.parentId) {
        where.parentId = filters.parentId;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [accounts, total] = await Promise.all([
        prisma.account.findMany({
          where,
          skip,
          take: limit,
          include: {
            parent: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            children: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          },
          orderBy: [
            { type: 'asc' },
            { code: 'asc' }
          ]
        }),
        prisma.account.count({ where })
      ]);

      return {
        accounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  /**
   * Get all active accounts (for balance calculations)
   * @returns {Promise<Array>} Array of active accounts
   */
  async findAllActive() {
    try {
      return await prisma.account.findMany({
        where: { isActive: true },
        orderBy: [
          { type: 'asc' },
          { code: 'asc' }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to fetch active accounts: ${error.message}`);
    }
  }

  /**
   * Find accounts by type
   * @param {string} type - Account type
   * @returns {Promise<Array>} Array of accounts
   */
  async findByType(type) {
    try {
      return await prisma.account.findMany({
        where: {
          type,
          isActive: true
        },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          children: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        },
        orderBy: { code: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to find accounts by type: ${error.message}`);
    }
  }

  /**
   * Create a new account
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created account
   */
  async create(accountData) {
    try {
      const account = await prisma.account.create({
        data: accountData,
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          children: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      });

      return account;
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new Error(`Account with this ${field} already exists`);
      }
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Update account by ID
   * @param {string} accountId - Account ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated account
   */
  async updateById(accountId, updateData) {
    try {
      const account = await prisma.account.update({
        where: { id: accountId },
        data: updateData,
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          children: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      });

      return account;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Account not found');
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new Error(`Account with this ${field} already exists`);
      }
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Delete account by ID (soft delete)
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Deleted account
   */
  async deleteById(accountId) {
    try {
      const account = await prisma.account.update({
        where: { id: accountId },
        data: { isActive: false },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      });

      return account;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Account not found');
      }
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get account hierarchy (tree structure)
   * @returns {Promise<Array>} Account hierarchy
   */
  async getHierarchy() {
    try {
      // Get all accounts
      const accounts = await prisma.account.findMany({
        where: { isActive: true },
        orderBy: [
          { type: 'asc' },
          { code: 'asc' }
        ]
      });

      // Build hierarchy
      const accountMap = new Map();
      const roots = [];

      // First pass: create map
      accounts.forEach(account => {
        accountMap.set(account.id, { ...account, children: [] });
      });

      // Second pass: build tree
      accounts.forEach(account => {
        const accountNode = accountMap.get(account.id);

        if (account.parentId) {
          const parent = accountMap.get(account.parentId);
          if (parent) {
            parent.children.push(accountNode);
          }
        } else {
          roots.push(accountNode);
        }
      });

      return roots;
    } catch (error) {
      throw new Error(`Failed to get account hierarchy: ${error.message}`);
    }
  }

  /**
   * Get child accounts
   * @param {string} parentId - Parent account ID
   * @returns {Promise<Array>} Child accounts
   */
  async getChildren(parentId) {
    try {
      return await prisma.account.findMany({
        where: {
          parentId,
          isActive: true
        },
        orderBy: { code: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to get child accounts: ${error.message}`);
    }
  }

  /**
   * Check if account has journal entries
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if account has journal entries
   */
  async hasJournalEntries(accountId) {
    try {
      const debitCount = await prisma.journalEntry.count({
        where: { debitAccountId: accountId }
      });

      const creditCount = await prisma.journalEntry.count({
        where: { creditAccountId: accountId }
      });

      return (debitCount + creditCount) > 0;
    } catch (error) {
      throw new Error(`Failed to check journal entries: ${error.message}`);
    }
  }

  /**
   * Calculate account balance
   * @param {string} accountId - Account ID
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Balance information
   */
  async calculateBalance(accountId, startDate = null, endDate = null) {
    try {
      // Build date filter
      const dateFilter = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;

      // Get debit entries
      const debitEntries = await prisma.journalEntry.findMany({
        where: {
          debitAccountId: accountId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        select: { amount: true }
      });

      // Get credit entries
      const creditEntries = await prisma.journalEntry.findMany({
        where: {
          creditAccountId: accountId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        select: { amount: true }
      });

      const totalDebit = debitEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const totalCredit = creditEntries.reduce((sum, entry) => sum + entry.amount, 0);

      return {
        debit: totalDebit,
        credit: totalCredit,
        balance: totalDebit - totalCredit
      };
    } catch (error) {
      throw new Error(`Failed to calculate balance: ${error.message}`);
    }
  }
}

module.exports = new AccountModel();