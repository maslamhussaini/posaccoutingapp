const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

/**
 * User service for business logic
 */
class UserService {
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get all users with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated users
   */
  async getAllUsers(page = 1, limit = 10) {
    return await userModel.findAll(page, limit);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user = await userModel.create({
      ...userData,
      password: hashedPassword
    });

    return user;
  }

  /**
   * Update user by ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUserById(userId, updateData) {
    // Hash password if provided
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    // Remove email from updateData if it's the same as current to avoid unique constraint issues
    if (updateData.email) {
      const currentUser = await userModel.findById(userId);
      if (currentUser && currentUser.email === updateData.email.toLowerCase()) {
        delete updateData.email;
      } else {
        updateData.email = updateData.email.toLowerCase();
      }
    }

    return await userModel.updateById(userId, updateData);
  }

  /**
   * Delete user by ID (soft delete)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async deleteUserById(userId) {
    return await userModel.deleteById(userId);
  }

  /**
   * Permanently delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async hardDeleteUserById(userId) {
    return await userModel.hardDeleteById(userId);
  }

  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  validateUserData(userData, isUpdate = false) {
    const errors = [];

    // Email validation
    if (!isUpdate || userData.email !== undefined) {
      if (!userData.email) {
        errors.push('Email is required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          errors.push('Invalid email format');
        }
      }
    }

    // Password validation (only for create or if password is provided in update)
    if (!isUpdate || userData.password !== undefined) {
      if (!userData.password) {
        errors.push('Password is required');
      } else if (userData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
    }

    // First name validation
    if (!isUpdate || userData.firstName !== undefined) {
      if (!userData.firstName || userData.firstName.trim().length === 0) {
        errors.push('First name is required');
      } else if (userData.firstName.length > 50) {
        errors.push('First name must be less than 50 characters');
      }
    }

    // Last name validation
    if (!isUpdate || userData.lastName !== undefined) {
      if (!userData.lastName || userData.lastName.trim().length === 0) {
        errors.push('Last name is required');
      } else if (userData.lastName.length > 50) {
        errors.push('Last name must be less than 50 characters');
      }
    }

    // Role validation
    if (userData.role !== undefined) {
      const validRoles = ['ADMIN', 'MANAGER', 'CASHIER'];
      if (!validRoles.includes(userData.role)) {
        errors.push('Invalid role. Must be one of: ADMIN, MANAGER, CASHIER');
      }
    }

    // isActive validation
    if (userData.isActive !== undefined && typeof userData.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = new UserService();