const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Journal model for database operations
 */
class JournalModel {
  /**
   * Find journal entry by ID
   * @param {string} entryId - Journal entry ID
   * @returns {Promise<Object|null>} Journal entry object or null
   */
  async findById(entryId) {
    try {
      return await prisma.journalEntry.findUnique({
        where: { id: entryId },
        include: {
          debitAccount: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          creditAccount: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
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
      throw new Error(`Failed to find journal entry: ${error.message}`);
    }
  }

  /**
   * Get all journal entries with pagination and filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of entries per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated journal entries result
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (filters.debitAccountId) {
        where.debitAccountId = filters.debitAccountId;
      }

      if (filters.creditAccountId) {
        where.creditAccountId = filters.creditAccountId;
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.startDate && filters.endDate) {
        where.date = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      if (filters.description) {
        where.description = {
          contains: filters.description,
          mode: 'insensitive'
        };
      }

      const [entries, total] = await Promise.all([
        prisma.journalEntry.findMany({
          where,
          skip,
          take: limit,
          include: {
            debitAccount: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true
              }
            },
            creditAccount: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { date: 'desc' }
        }),
        prisma.journalEntry.count({ where })
      ]);

      return {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }
  }

  /**
   * Create a new journal entry
   * @param {Object} entryData - Journal entry data
   * @returns {Promise<Object>} Created journal entry
   */
  async create(entryData) {
    try {
      const entry = await prisma.journalEntry.create({
        data: entryData,
        include: {
          debitAccount: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          creditAccount: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return entry;
    } catch (error) {
      if (error.code === 'P2003') {
        throw new Error('Invalid account or user ID');
      }
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }
  }

  /**
   * Create double-entry journal entries for a sale
   * @param {string} saleId - Sale ID
   * @param {number} amount - Sale amount
   * @param {string} paymentMethod - Payment method
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Created journal entries
   */
  async createSaleEntries(saleId, amount, paymentMethod, userId) {
    try {
      const entries = [];

      // Determine accounts based on payment method
      let debitAccountCode, creditAccountCode;

      switch (paymentMethod.toLowerCase()) {
        case 'cash':
          debitAccountCode = '1001'; // Cash account
          break;
        case 'card':
        case 'credit_card':
          debitAccountCode = '1002'; // Bank account
          break;
        case 'account':
        case 'customer_account':
          debitAccountCode = '1003'; // Accounts receivable
          break;
        default:
          debitAccountCode = '1001'; // Default to cash
      }

      creditAccountCode = '4001'; // Sales revenue account

      // Find accounts by code
      const [debitAccount, creditAccount] = await Promise.all([
        prisma.account.findUnique({ where: { code: debitAccountCode } }),
        prisma.account.findUnique({ where: { code: creditAccountCode } })
      ]);

      if (!debitAccount) {
        throw new Error(`Debit account with code ${debitAccountCode} not found`);
      }

      if (!creditAccount) {
        throw new Error(`Credit account with code ${creditAccountCode} not found`);
      }

      // Create debit entry (increase asset/liability)
      const debitEntry = await this.create({
        date: new Date(),
        description: `Sale transaction - ${saleId}`,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        amount,
        userId
      });

      entries.push(debitEntry);

      return entries;
    } catch (error) {
      throw new Error(`Failed to create sale journal entries: ${error.message}`);
    }
  }

  /**
   * Get account balance
   * @param {string} accountId - Account ID
   * @returns {Promise<number>} Account balance
   */
  async getAccountBalance(accountId) {
    try {
      const [debitSum, creditSum] = await Promise.all([
        prisma.journalEntry.aggregate({
          where: { debitAccountId: accountId },
          _sum: { amount: true }
        }),
        prisma.journalEntry.aggregate({
          where: { creditAccountId: accountId },
          _sum: { amount: true }
        })
      ]);

      const debitTotal = debitSum._sum.amount || 0;
      const creditTotal = creditSum._sum.amount || 0;

      // For asset/liability accounts: balance = debit - credit
      // For equity/revenue accounts: balance = credit - debit
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { type: true }
      });

      if (account.type === 'ASSET' || account.type === 'LIABILITY') {
        return debitTotal - creditTotal;
      } else {
        return creditTotal - debitTotal;
      }
    } catch (error) {
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Get journal entries summary
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Journal entries summary
   */
  async getEntriesSummary(filters = {}) {
    try {
      const where = {};

      if (filters.startDate && filters.endDate) {
        where.date = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      const summary = await prisma.journalEntry.aggregate({
        where,
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      });

      return {
        totalEntries: summary._count.id,
        totalAmount: summary._sum.amount || 0
      };
    } catch (error) {
      throw new Error(`Failed to get journal entries summary: ${error.message}`);
    }
  }
}

module.exports = new JournalModel();