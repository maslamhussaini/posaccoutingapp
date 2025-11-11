const userService = require('../services/userService');

/**
 * User controller for handling user-related HTTP requests
 */
class UserController {
  /**
   * Get all users with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100'
        });
      }

      const result = await userService.getAllUsers(page, limit);

      res.status(200).json({
        message: 'Users retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      // Check if user is trying to access their own profile or is admin
      if (req.user.role !== 'ADMIN' && req.user.userId !== userId) {
        return res.status(403).json({
          error: 'AuthorizationError',
          message: 'You can only view your own profile'
        });
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        message: 'User retrieved successfully',
        user
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;

      // Validate user data
      userService.validateUserData(userData);

      const user = await userService.createUser(userData);

      res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Update user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateUserById(req, res, next) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      // Check if user is trying to update their own profile or is admin
      if (req.user.role !== 'ADMIN' && req.user.userId !== userId) {
        return res.status(403).json({
          error: 'AuthorizationError',
          message: 'You can only update your own profile'
        });
      }

      // Prevent non-admin users from changing role or isActive status
      if (req.user.role !== 'ADMIN') {
        delete updateData.role;
        delete updateData.isActive;
      }

      // Validate update data
      userService.validateUserData(updateData, true);

      const user = await userService.updateUserById(userId, updateData);

      res.status(200).json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          error: 'ValidationError',
          message: error.message
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: 'ConflictError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Delete user by ID (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteUserById(req, res, next) {
    try {
      const { userId } = req.params;

      // Prevent users from deleting themselves
      if (req.user.userId === userId) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'You cannot delete your own account'
        });
      }

      const user = await userService.deleteUserById(userId);

      res.status(200).json({
        message: 'User deleted successfully',
        user
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Permanently delete user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async hardDeleteUserById(req, res, next) {
    try {
      const { userId } = req.params;

      // Prevent users from deleting themselves
      if (req.user.userId === userId) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'You cannot delete your own account'
        });
      }

      const user = await userService.hardDeleteUserById(userId);

      res.status(200).json({
        message: 'User permanently deleted successfully',
        user
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'NotFoundError',
          message: error.message
        });
      }

      next(error);
    }
  }
}

module.exports = new UserController();