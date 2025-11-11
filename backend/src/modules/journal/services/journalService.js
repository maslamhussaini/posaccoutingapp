const journalModel = require('../models/journalModel');
const accountModel = require('../../chart-of-accounts/models/accountModel');

/**
 * Journal service for business logic and auto-posting
 */
class JournalService {
  /**
   * Get journal entry by ID
   * @param {string} entryId - Journal entry ID
   * @returns {Promise<Object>} Journal entry object
   */
  async getJournalEntryById(entryId) {
    const entry = await journalModel.findById(entryId);

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    return entry;
  }

  /**
   * Get all journal entries with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated journal entries
   */
  async getAllJournalEntries(page = 1, limit = 10, filters = {}) {
    return await journalModel.findAll(page, limit, filters);
  }

  /**
   * Create a manual journal entry
   * @param {Object} entryData - Journal entry data
   * @returns {Promise<Object>} Created journal entry
   */
  async createJournalEntry(entryData) {
    // Validate accounts exist
    const debitAccount = await accountModel.findById(entryData.debitAccountId);
    if (!debitAccount || !debitAccount.isActive) {
      throw new Error('Debit account not found or inactive');
    }

    const creditAccount = await accountModel.findById(entryData.creditAccountId);
    if (!creditAccount || !creditAccount.isActive) {
      throw new Error('Credit account not found or inactive');
    }

    // Ensure double-entry principle: debit and credit accounts must be different
    if (entryData.debitAccountId === entryData.creditAccountId) {
      throw new Error('Debit and credit accounts must be different');
    }

    // Validate amount is positive
    if (entryData.amount <= 0) {
      throw new Error('Journal entry amount must be positive');
    }

    return await journalModel.create(entryData);
  }

  /**
   * Create journal entries for a sale transaction (double-entry)
   * @param {string} saleId - Sale ID
   * @param {number} total - Sale total amount
   * @param {string} paymentMethod - Payment method
   * @param {string} userId - User ID creating the entry
   * @returns {Promise<Object>} Created journal entry
   */
  async createSaleJournalEntries(saleId, total, paymentMethod, userId) {
    // For sales: Debit Cash/Bank (Asset) and Credit Sales Revenue (Revenue)
    // This follows the accounting equation: Assets = Liabilities + Equity + Revenue

    const cashAccountCode = this.getCashAccountCode(paymentMethod);
    const revenueAccountCode = '4000'; // Sales Revenue account

    // Get account IDs by code
    const cashAccount = await accountModel.findByCode(cashAccountCode);
    const revenueAccount = await accountModel.findByCode(revenueAccountCode);

    if (!cashAccount || !revenueAccount) {
      throw new Error('Required accounts not found for sale transaction');
    }

    const entryData = {
      date: new Date(),
      description: `Sale transaction - ${saleId}`,
      debitAccountId: cashAccount.id, // Debit cash/bank (increase asset)
      creditAccountId: revenueAccount.id, // Credit sales revenue (increase revenue)
      amount: total,
      userId
    };

    return await this.createJournalEntry(entryData);
  }

  /**
   * Create journal entries for a purchase transaction (double-entry)
   * @param {string} purchaseId - Purchase ID
   * @param {number} total - Purchase total amount
   * @param {string} userId - User ID creating the entry
   * @returns {Promise<Object>} Created journal entry
   */
  async createPurchaseJournalEntries(purchaseId, total, userId) {
    // For purchases: Debit Inventory (Asset) and Credit Accounts Payable (Liability)
    // This follows: Assets + Expenses = Liabilities + Equity + Revenue

    const inventoryAccountCode = '1200'; // Inventory account
    const accountsPayableCode = '2000'; // Accounts Payable

    // Get account IDs by code
    const inventoryAccount = await accountModel.findByCode(inventoryAccountCode);
    const payableAccount = await accountModel.findByCode(accountsPayableCode);

    if (!inventoryAccount || !payableAccount) {
      throw new Error('Required accounts not found for purchase transaction');
    }

    const entryData = {
      date: new Date(),
      description: `Purchase transaction - ${purchaseId}`,
      debitAccountId: inventoryAccount.id, // Debit inventory (increase asset)
      creditAccountId: payableAccount.id, // Credit accounts payable (increase liability)
      amount: total,
      userId
    };

    return await this.createJournalEntry(entryData);
  }

  /**
   * Create journal entries for a return transaction (double-entry)
   * @param {string} returnId - Return ID
   * @param {number} total - Return total amount
   * @param {string} paymentMethod - Original payment method
   * @param {string} userId - User ID creating the entry
   * @returns {Promise<Object>} Created journal entry
   */
  async createReturnJournalEntries(returnId, total, paymentMethod, userId) {
    // For returns: Reverse the original sale
    // Debit Sales Revenue (decrease revenue) and Credit Cash/Bank (decrease asset)

    const cashAccountCode = this.getCashAccountCode(paymentMethod);
    const revenueAccountCode = '4000'; // Sales Revenue account

    // Get account IDs by code
    const cashAccount = await accountModel.findByCode(cashAccountCode);
    const revenueAccount = await accountModel.findByCode(revenueAccountCode);

    if (!cashAccount || !revenueAccount) {
      throw new Error('Required accounts not found for return transaction');
    }

    const entryData = {
      date: new Date(),
      description: `Return transaction - ${returnId}`,
      debitAccountId: revenueAccount.id, // Debit sales revenue (decrease revenue)
      creditAccountId: cashAccount.id, // Credit cash/bank (decrease asset)
      amount: total,
      userId
    };

    return await this.createJournalEntry(entryData);
  }

  /**
   * Get cash account code based on payment method
   * @param {string} paymentMethod - Payment method
   * @returns {string} Account code
   */
  getCashAccountCode(paymentMethod) {
    const accountCodes = {
      cash: '1001', // Cash on hand
      card: '1002', // Bank account - Card payments
      bank_transfer: '1002', // Bank account - Transfers
      check: '1003', // Bank account - Checks
      digital_wallet: '1004' // Digital wallet account
    };

    return accountCodes[paymentMethod] || '1001'; // Default to cash
  }

  /**
   * Update journal entry by ID
   * @param {string} entryId - Journal entry ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated journal entry
   */
  async updateJournalEntryById(entryId, updateData) {
    // Validate accounts if being updated
    if (updateData.debitAccountId) {
      const debitAccount = await accountModel.findById(updateData.debitAccountId);
      if (!debitAccount || !debitAccount.isActive) {
        throw new Error('Debit account not found or inactive');
      }
    }

    if (updateData.creditAccountId) {
      const creditAccount = await accountModel.findById(updateData.creditAccountId);
      if (!creditAccount || !creditAccount.isActive) {
        throw new Error('Credit account not found or inactive');
      }
    }

    // Ensure double-entry principle if both accounts are being updated
    if (updateData.debitAccountId && updateData.creditAccountId) {
      if (updateData.debitAccountId === updateData.creditAccountId) {
        throw new Error('Debit and credit accounts must be different');
      }
    }

    // Validate amount if being updated
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      throw new Error('Journal entry amount must be positive');
    }

    return await journalModel.updateById(entryId, updateData);
  }

  /**
   * Delete journal entry by ID
   * @param {string} entryId - Journal entry ID
   * @returns {Promise<Object>} Deleted journal entry
   */
  async deleteJournalEntryById(entryId) {
    return await journalModel.deleteById(entryId);
  }

  /**
   * Get journal summary for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Journal summary
   */
  async getJournalSummary(startDate, endDate) {
    return await journalModel.getSummary(startDate, endDate);
  }

  /**
   * Get account balance from journal entries
   * @param {string} accountId - Account ID
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Account balance
   */
  async getAccountBalance(accountId, startDate = null, endDate = null) {
    return await journalModel.getAccountBalance(accountId, startDate, endDate);
  }

  /**
   * Validate journal entry data
   * @param {Object} entryData - Journal entry data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateJournalEntryData(entryData, isUpdate = false) {
    const errors = [];

    // Date validation
    if (!isUpdate || entryData.date !== undefined) {
      if (!entryData.date) {
        errors.push('Date is required');
      } else if (isNaN(new Date(entryData.date).getTime())) {
        errors.push('Invalid date format');
      }
    }

    // Description validation
    if (!isUpdate || entryData.description !== undefined) {
      if (!entryData.description || entryData.description.trim().length === 0) {
        errors.push('Description is required');
      } else if (entryData.description.length > 255) {
        errors.push('Description must be less than 255 characters');
      }
    }

    // Debit account ID validation
    if (!isUpdate || entryData.debitAccountId !== undefined) {
      if (!entryData.debitAccountId) {
        errors.push('Debit account ID is required');
      }
    }

    // Credit account ID validation
    if (!isUpdate || entryData.creditAccountId !== undefined) {
      if (!entryData.creditAccountId) {
        errors.push('Credit account ID is required');
      }
    }

    // Amount validation
    if (!isUpdate || entryData.amount !== undefined) {
      if (entryData.amount === undefined || entryData.amount === null) {
        errors.push('Amount is required');
      } else if (typeof entryData.amount !== 'number' || entryData.amount <= 0) {
        errors.push('Amount must be a positive number');
      }
    }

    // User ID validation
    if (!isUpdate || entryData.userId !== undefined) {
      if (!entryData.userId) {
        errors.push('User ID is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new JournalService();