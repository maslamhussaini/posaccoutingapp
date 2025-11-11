const authService = require('../services/authService');

/**
 * Authentication controller for handling auth-related HTTP requests
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Email, password, firstName, and lastName are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid email format'
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Password must be at least 6 characters long'
        });
      }

      // Validate role if provided
      const validRoles = ['ADMIN', 'MANAGER', 'CASHIER'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid role. Must be one of: ADMIN, MANAGER, CASHIER'
        });
      }

      const user = await authService.register({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        role
      });

      res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
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
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Email and password are required'
        });
      }

      const result = await authService.login(email.toLowerCase(), password);

      res.status(200).json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      if (error.message === 'Invalid email or password' ||
          error.message === 'Account is deactivated') {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Refresh token is required'
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        message: 'Token refreshed successfully',
        ...result
      });
    } catch (error) {
      if (error.message === 'Invalid or expired refresh token' ||
          error.message === 'Token expired' ||
          error.message === 'Invalid token' ||
          error.message === 'User not found or inactive') {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Refresh token is required'
        });
      }

      await authService.logout(refreshToken);

      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfile(req, res, next) {
    try {
      // User data is attached by auth middleware
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
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

module.exports = new AuthController();