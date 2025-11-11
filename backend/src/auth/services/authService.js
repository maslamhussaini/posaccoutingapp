const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication service for handling user authentication operations
 */
class AuthService {
  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if passwords match
   */
  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Error comparing passwords');
    }
  }

  /**
   * Generate JWT access token
   * @param {Object} payload - User data to include in token
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      });
    } catch (error) {
      throw new Error('Error generating access token');
    }
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - User data to include in token
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d'
      });
    } catch (error) {
      throw new Error('Error generating refresh token');
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.role - User role (optional, defaults to CASHIER)
   * @returns {Promise<Object>} Created user data (without password)
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
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
          createdAt: true
        }
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // Store refresh token in database
      await this.storeRefreshToken(user.id, refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Store refresh token in database
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async storeRefreshToken(userId, token) {
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt
        }
      });
    } catch (error) {
      throw new Error('Error storing refresh token');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token and user data
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken);

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = this.generateAccessToken(payload);

      return {
        user,
        accessToken: newAccessToken
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user by removing refresh token
   * @param {string} refreshToken - Refresh token to remove
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    } catch (error) {
      throw new Error('Error during logout');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();