const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../../../auth/middleware/authMiddleware');

/**
 * User routes
 * Base path: /api/users
 */

// GET /api/users - Get all users (Admin only)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  userController.getAllUsers
);

// GET /api/users/:userId - Get user by ID (Admin or own profile)
router.get(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  userController.getUserById
);

// POST /api/users - Create new user (Admin only)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  userController.createUser
);

// PUT /api/users/:userId - Update user by ID (Admin or own profile)
router.put(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  userController.updateUserById
);

// DELETE /api/users/:userId - Soft delete user by ID (Admin only)
router.delete(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  userController.deleteUserById
);

// DELETE /api/users/:userId/hard - Permanently delete user by ID (Admin only)
router.delete(
  '/:userId/hard',
  authMiddleware.authenticate,
  authMiddleware.adminOnly,
  userController.hardDeleteUserById
);

module.exports = router;