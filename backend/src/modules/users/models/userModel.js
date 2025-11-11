const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * User model for database operations
 */
class UserModel {
  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(userId) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email) {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Get all users with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of users per page
   * @returns {Promise<Object>} Paginated users result
   */
  async findAll(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'CASHIER'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('User with this email already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user by ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateById(userId, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
      if (error.code === 'P2002') {
        throw new Error('User with this email already exists');
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user by ID (soft delete by setting isActive to false)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async deleteById(userId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Permanently delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async hardDeleteById(userId) {
    try {
      const user = await prisma.user.delete({
        where: { id: userId }
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to permanently delete user: ${error.message}`);
    }
  }
}

module.exports = new UserModel();