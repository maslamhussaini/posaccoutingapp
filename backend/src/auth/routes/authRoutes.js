const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Authentication routes
 * Base path: /api/auth
 */

// Public routes (no authentication required)

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 * @body {email: string, password: string, firstName: string, lastName: string, role?: string}
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 * @body {email: string, password: string}
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (requires valid refresh token)
 * @body {refreshToken: string}
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public (requires refresh token)
 * @body {refreshToken: string}
 */
router.post('/logout', authController.logout);

// Protected routes (authentication required)

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private (authenticated users only)
 */
router.get('/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

// Admin-only routes

/**
 * @route GET /api/auth/admin-test
 * @desc Test endpoint for admin access
 * @access Private (admin only)
 */
router.get('/admin-test',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  (req, res) => {
    res.json({
      message: 'Admin access granted',
      user: req.user
    });
  }
);

// Manager and Admin routes

/**
 * @route GET /api/auth/manager-test
 * @desc Test endpoint for manager and admin access
 * @access Private (manager and admin only)
 */
router.get('/manager-test',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  (req, res) => {
    res.json({
      message: 'Manager/Admin access granted',
      user: req.user
    });
  }
);

// All authenticated users routes

/**
 * @route GET /api/auth/user-test
 * @desc Test endpoint for all authenticated users
 * @access Private (all authenticated users)
 */
router.get('/user-test',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  (req, res) => {
    res.json({
      message: 'Authenticated user access granted',
      user: req.user
    });
  }
);

module.exports = router;