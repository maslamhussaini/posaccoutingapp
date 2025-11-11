const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../../../auth/middleware/authMiddleware');

/**
 * Category routes
 * Base path: /api/categories
 */

// GET /api/categories - Get all categories (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  categoryController.getAllCategories
);

// GET /api/categories/with-counts - Get categories with product counts (Authenticated users)
router.get(
  '/with-counts',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  categoryController.getCategoriesWithProductCounts
);

// GET /api/categories/:categoryId - Get category by ID (Authenticated users)
router.get(
  '/:categoryId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  categoryController.getCategoryById
);

// POST /api/categories - Create new category (Manager and Admin)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  categoryController.createCategory
);

// PUT /api/categories/:categoryId - Update category by ID (Manager and Admin)
router.put(
  '/:categoryId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  categoryController.updateCategoryById
);

// DELETE /api/categories/:categoryId - Soft delete category by ID (Manager and Admin)
router.delete(
  '/:categoryId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  categoryController.deleteCategoryById
);

module.exports = router;