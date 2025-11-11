const accountModel = require('../models/accountModel');

/**
 * Chart of Accounts service for business logic
 */
class ChartOfAccountsService {
  /**
   * Get account by ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Account object
   */
  async getAccountById(accountId) {
    const account = await accountModel.findById(accountId);

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  /**
   * Get account by code
   * @param {string} code - Account code
   * @returns {Promise<Object>} Account object
   */
  async getAccountByCode(code) {
    const account = await accountModel.findByCode(code);

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  /**
   * Get all accounts with pagination and filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated accounts
   */
  async getAllAccounts(page = 1, limit = 10, filters = {}) {
    return await accountModel.findAll(page, limit, filters);
  }

  /**
   * Create a new account
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created account
   */
  async createAccount(accountData) {
    // Validate account code uniqueness
    if (accountData.code) {
      const existingAccount = await accountModel.findByCode(accountData.code);
      if (existingAccount) {
        throw new Error('Account with this code already exists');
      }
    }

    // Validate parent account if provided
    if (accountData.parentId) {
      const parentAccount = await accountModel.findById(accountData.parentId);
      if (!parentAccount) {
        throw new Error('Parent account not found');
      }
    }

    return await accountModel.create(accountData);
  }

  /**
   * Update account by ID
   * @param {string} accountId - Account ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated account
   */
  async updateAccountById(accountId, updateData) {
    // Validate account code uniqueness if being updated
    if (updateData.code) {
      const existingAccount = await accountModel.findByCode(updateData.code);
      if (existingAccount && existingAccount.id !== accountId) {
        throw new Error('Account with this code already exists');
      }
    }

    // Validate parent account if being updated
    if (updateData.parentId) {
      const parentAccount = await accountModel.findById(updateData.parentId);
      if (!parentAccount) {
        throw new Error('Parent account not found');
      }
      // Prevent circular reference
      if (updateData.parentId === accountId) {
        throw new Error('Account cannot be its own parent');
      }
    }

    return await accountModel.updateById(accountId, updateData);
  }

  /**
   * Delete account by ID (soft delete)
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Deleted account
   */
  async deleteAccountById(accountId) {
    // Check if account has children
    const children = await accountModel.getChildren(accountId);
    if (children.length > 0) {
      throw new Error('Cannot delete account with child accounts');
    }

    // Check if account has journal entries
    const hasEntries = await accountModel.hasJournalEntries(accountId);
    if (hasEntries) {
      throw new Error('Cannot delete account with journal entries');
    }

    return await accountModel.deleteById(accountId);
  }

  /**
   * Get account hierarchy (tree structure)
   * @returns {Promise<Array>} Account hierarchy
   */
  async getAccountHierarchy() {
    return await accountModel.getHierarchy();
  }

  /**
   * Get accounts by type
   * @param {string} type - Account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
   * @returns {Promise<Array>} Accounts of specified type
   */
  async getAccountsByType(type) {
    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid account type');
    }

    return await accountModel.findByType(type);
  }

  /**
   * Get account balance
   * @param {string} accountId - Account ID
   * @param {Date} startDate - Start date for balance calculation
   * @param {Date} endDate - End date for balance calculation
   * @returns {Promise<Object>} Account balance information
   */
  async getAccountBalance(accountId, startDate, endDate) {
    const account = await this.getAccountById(accountId);

    const balance = await accountModel.calculateBalance(accountId, startDate, endDate);

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type
      },
      balance,
      period: {
        startDate,
        endDate
      }
    };
  }

  /**
   * Get trial balance
   * @param {Date} asOfDate - Date for trial balance
   * @returns {Promise<Object>} Trial balance
   */
  async getTrialBalance(asOfDate = new Date()) {
    const accounts = await accountModel.findAllActive();

    const trialBalance = {
      date: asOfDate,
      accounts: [],
      totals: {
        debit: 0,
        credit: 0
      }
    };

    for (const account of accounts) {
      const balance = await accountModel.calculateBalance(account.id, null, asOfDate);

      // For assets and expenses, debit balance is normal
      // For liabilities, equity, and revenue, credit balance is normal
      const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type);
      const normalBalance = isDebitNormal ? balance.debit - balance.credit : balance.credit - balance.debit;

      trialBalance.accounts.push({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: balance.debit,
        credit: balance.credit,
        balance: normalBalance
      });

      trialBalance.totals.debit += balance.debit;
      trialBalance.totals.credit += balance.credit;
    }

    return trialBalance;
  }

  /**
   * Validate account data
   * @param {Object} accountData - Account data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateAccountData(accountData, isUpdate = false) {
    const errors = [];

    // Code validation
    if (!isUpdate || accountData.code !== undefined) {
      if (!accountData.code || accountData.code.trim().length === 0) {
        errors.push('Account code is required');
      } else if (accountData.code.length > 20) {
        errors.push('Account code must be less than 20 characters');
      }
    }

    // Name validation
    if (!isUpdate || accountData.name !== undefined) {
      if (!accountData.name || accountData.name.trim().length === 0) {
        errors.push('Account name is required');
      } else if (accountData.name.length > 100) {
        errors.push('Account name must be less than 100 characters');
      }
    }

    // Type validation
    if (!isUpdate || accountData.type !== undefined) {
      const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
      if (!accountData.type || !validTypes.includes(accountData.type)) {
        errors.push('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
      }
    }

    // Parent ID validation (optional)
    if (accountData.parentId !== undefined && accountData.parentId !== null) {
      if (typeof accountData.parentId !== 'string' || accountData.parentId.trim().length === 0) {
        errors.push('Parent ID must be a valid string');
      }
    }

    // isActive validation
    if (accountData.isActive !== undefined && typeof accountData.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new ChartOfAccountsService();