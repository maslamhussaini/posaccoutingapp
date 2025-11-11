const cashRegisterModel = require('../models/cashRegisterModel');
const cashMovementModel = require('../models/cashMovementModel');

/**
 * Cash register service for business logic
 */
class CashRegisterService {
  /**
   * Get cash register by ID
   * @param {string} registerId - Cash register ID
   * @returns {Promise<Object>} Cash register object
   */
  async getCashRegisterById(registerId) {
    const cashRegister = await cashRegisterModel.findById(registerId);

    if (!cashRegister) {
      throw new Error('Cash register not found');
    }

    return cashRegister;
  }

  /**
   * Get all cash registers
   * @returns {Promise<Array>} Array of cash registers
   */
  async getAllCashRegisters() {
    return await cashRegisterModel.findAll();
  }

  /**
   * Create a new cash register
   * @param {Object} registerData - Cash register data
   * @returns {Promise<Object>} Created cash register
   */
  async createCashRegister(registerData) {
    // Validate register data
    this.validateCashRegisterData(registerData);

    return await cashRegisterModel.create(registerData);
  }

  /**
   * Update cash register by ID
   * @param {string} registerId - Cash register ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated cash register
   */
  async updateCashRegisterById(registerId, updateData) {
    // Validate update data
    this.validateCashRegisterData(updateData, true);

    return await cashRegisterModel.updateById(registerId, updateData);
  }

  /**
   * Delete cash register by ID
   * @param {string} registerId - Cash register ID
   * @returns {Promise<Object>} Deleted cash register
   */
  async deleteCashRegisterById(registerId) {
    return await cashRegisterModel.deleteById(registerId);
  }

  /**
   * Open cash register
   * @param {string} registerId - Cash register ID
   * @param {number} openingBalance - Opening balance
   * @param {string} userId - User ID opening the register
   * @returns {Promise<Object>} Opened cash register
   */
  async openCashRegister(registerId, openingBalance, userId) {
    // Check if register exists
    const cashRegister = await this.getCashRegisterById(registerId);

    // Check if register is already open
    if (cashRegister.isOpen) {
      throw new Error('Cash register is already open');
    }

    // Check if user already has an open register
    const openRegister = await cashRegisterModel.findOpenByUserId(userId);
    if (openRegister) {
      throw new Error('User already has an open cash register');
    }

    // Validate opening balance
    if (openingBalance < 0) {
      throw new Error('Opening balance cannot be negative');
    }

    // Open the register
    const openedRegister = await cashRegisterModel.updateById(registerId, {
      isOpen: true,
      openingBalance,
      currentBalance: openingBalance,
      openedAt: new Date(),
      openedById: userId
    });

    // Create opening movement
    await cashMovementModel.create({
      cashRegisterId: registerId,
      type: 'OPENING',
      amount: openingBalance,
      description: 'Cash register opened',
      userId
    });

    return openedRegister;
  }

  /**
   * Close cash register
   * @param {string} registerId - Cash register ID
   * @param {number} actualBalance - Actual counted balance
   * @param {string} userId - User ID closing the register
   * @returns {Promise<Object>} Closure summary
   */
  async closeCashRegister(registerId, actualBalance, userId) {
    // Check if register exists and is open
    const cashRegister = await this.getCashRegisterById(registerId);

    if (!cashRegister.isOpen) {
      throw new Error('Cash register is not open');
    }

    // Check if user is the one who opened it (or admin)
    if (cashRegister.openedById !== userId) {
      // In a real app, you'd check for admin role here
      throw new Error('Only the user who opened the register can close it');
    }

    // Validate actual balance
    if (actualBalance < 0) {
      throw new Error('Actual balance cannot be negative');
    }

    // Calculate expected balance (opening + sales - returns - withdrawals + deposits)
    const expectedBalance = await this.calculateExpectedBalance(registerId);

    // Create closing movement
    await cashMovementModel.create({
      cashRegisterId: registerId,
      type: 'CLOSING',
      amount: actualBalance,
      description: `Cash register closed. Expected: ${expectedBalance}, Actual: ${actualBalance}`,
      userId
    });

    // Close the register
    const closedRegister = await cashRegisterModel.updateById(registerId, {
      isOpen: false,
      currentBalance: actualBalance,
      closedAt: new Date(),
      closedById: userId
    });

    // Return closure summary
    return {
      cashRegister: closedRegister,
      summary: {
        openingBalance: cashRegister.openingBalance,
        expectedBalance,
        actualBalance,
        difference: actualBalance - expectedBalance
      }
    };
  }

  /**
   * Calculate expected balance for a cash register
   * @param {string} registerId - Cash register ID
   * @returns {Promise<number>} Expected balance
   */
  async calculateExpectedBalance(registerId) {
    // Get all movements for the register since it was opened
    const cashRegister = await this.getCashRegisterById(registerId);
    if (!cashRegister.openedAt) {
      return 0;
    }

    const movements = await cashMovementModel.findByDateRange(
      cashRegister.openedAt,
      new Date(),
      registerId
    );

    let balance = cashRegister.openingBalance;

    movements.forEach(movement => {
      switch (movement.type) {
        case 'OPENING':
          // Already included in opening balance
          break;
        case 'SALE':
        case 'DEPOSIT':
          balance += movement.amount;
          break;
        case 'RETURN':
        case 'WITHDRAWAL':
          balance -= movement.amount;
          break;
        case 'CLOSING':
          // Closing doesn't affect balance calculation
          break;
      }
    });

    return balance;
  }

  /**
   * Record cash deposit
   * @param {string} registerId - Cash register ID
   * @param {number} amount - Deposit amount
   * @param {string} description - Deposit description
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created movement
   */
  async recordDeposit(registerId, amount, description, userId) {
    // Validate register is open
    const cashRegister = await this.getCashRegisterById(registerId);
    if (!cashRegister.isOpen) {
      throw new Error('Cash register is not open');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    // Create deposit movement
    const movement = await cashMovementModel.create({
      cashRegisterId: registerId,
      type: 'DEPOSIT',
      amount,
      description: description || 'Cash deposit',
      userId
    });

    // Update current balance
    await cashRegisterModel.updateById(registerId, {
      currentBalance: cashRegister.currentBalance + amount
    });

    return movement;
  }

  /**
   * Record cash withdrawal
   * @param {string} registerId - Cash register ID
   * @param {number} amount - Withdrawal amount
   * @param {string} description - Withdrawal description
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created movement
   */
  async recordWithdrawal(registerId, amount, description, userId) {
    // Validate register is open
    const cashRegister = await this.getCashRegisterById(registerId);
    if (!cashRegister.isOpen) {
      throw new Error('Cash register is not open');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    // Check sufficient balance
    if (cashRegister.currentBalance < amount) {
      throw new Error('Insufficient cash register balance');
    }

    // Create withdrawal movement
    const movement = await cashMovementModel.create({
      cashRegisterId: registerId,
      type: 'WITHDRAWAL',
      amount,
      description: description || 'Cash withdrawal',
      userId
    });

    // Update current balance
    await cashRegisterModel.updateById(registerId, {
      currentBalance: cashRegister.currentBalance - amount
    });

    return movement;
  }

  /**
   * Record sale transaction
   * @param {string} registerId - Cash register ID
   * @param {number} amount - Sale amount
   * @param {string} reference - Sale reference (sale ID)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created movement
   */
  async recordSale(registerId, amount, reference, userId) {
    // Validate register is open
    const cashRegister = await this.getCashRegisterById(registerId);
    if (!cashRegister.isOpen) {
      throw new Error('Cash register is not open');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Sale amount must be positive');
    }

    // Create sale movement
    const movement = await cashMovementModel.create({
      cashRegisterId: registerId,
      type: 'SALE',
      amount,
      description: 'Sale transaction',
      reference,
      userId
    });

    // Update current balance
    await cashRegisterModel.updateById(registerId, {
      currentBalance: cashRegister.currentBalance + amount
    });

    return movement;
  }

  /**
   * Record return transaction
   * @param {string} registerId - Cash register ID
   * @param {number} amount - Return amount
   * @param {string} reference - Return reference (return ID)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created movement
   */
  async recordReturn(registerId, amount, reference, userId) {
    // Validate register is open
    const cashRegister = await this.getCashRegisterById(registerId);
    if (!cashRegister.isOpen) {
      throw new Error('Cash register is not open');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Return amount must be positive');
    }

    // Check sufficient balance
    if (cashRegister.currentBalance < amount) {
      throw new Error('Insufficient cash register balance for return');
    }

    // Create return movement
    const movement = await cashMovementModel.create({
      cashRegisterId: registerId,
      type: 'RETURN',
      amount,
      description: 'Return transaction',
      reference,
      userId
    });

    // Update current balance
    await cashRegisterModel.updateById(registerId, {
      currentBalance: cashRegister.currentBalance - amount
    });

    return movement;
  }

  /**
   * Get daily summary for a date
   * @param {Date} date - Date for summary
   * @param {string} registerId - Optional register ID filter
   * @returns {Promise<Object>} Daily summary
   */
  async getDailySummary(date, registerId = null) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get movements for the day
    const movements = await cashMovementModel.findByDateRange(startDate, endDate, registerId);

    // Get movement totals
    const totals = await cashMovementModel.getTotalsByType(startDate, endDate, registerId);

    // Get registers that were active during this period
    const registers = await cashRegisterModel.getWithMovements(startDate, endDate);

    return {
      date,
      registers: registerId ? registers.filter(r => r.id === registerId) : registers,
      movements,
      totals,
      summary: {
        totalSales: totals.SALE?.total || 0,
        totalReturns: totals.RETURN?.total || 0,
        totalDeposits: totals.DEPOSIT?.total || 0,
        totalWithdrawals: totals.WITHDRAWAL?.total || 0,
        netCashFlow: (totals.SALE?.total || 0) - (totals.RETURN?.total || 0) +
                    (totals.DEPOSIT?.total || 0) - (totals.WITHDRAWAL?.total || 0)
      }
    };
  }

  /**
   * Get cash register status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Register status
   */
  async getUserRegisterStatus(userId) {
    const openRegister = await cashRegisterModel.findOpenByUserId(userId);

    if (openRegister) {
      const expectedBalance = await this.calculateExpectedBalance(openRegister.id);
      return {
        hasOpenRegister: true,
        register: openRegister,
        expectedBalance,
        difference: openRegister.currentBalance - expectedBalance
      };
    }

    return {
      hasOpenRegister: false,
      register: null
    };
  }

  /**
   * Validate cash register data
   * @param {Object} data - Data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateCashRegisterData(data, isUpdate = false) {
    const errors = [];

    // Name validation
    if (!isUpdate || data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Name is required');
      } else if (data.name.length > 100) {
        errors.push('Name must be less than 100 characters');
      }
    }

    // Balance validations (only for specific operations)
    if (data.openingBalance !== undefined && data.openingBalance < 0) {
      errors.push('Opening balance cannot be negative');
    }

    if (data.currentBalance !== undefined && data.currentBalance < 0) {
      errors.push('Current balance cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new CashRegisterService();