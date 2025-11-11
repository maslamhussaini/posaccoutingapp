const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../../../auth/middleware/authMiddleware');

/**
 * Product routes
 * Base path: /api/products
 */

// GET /api/products - Get all products (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  productController.getAllProducts
);

// GET /api/products/low-stock - Get low stock products (Manager and Admin)
router.get(
  '/low-stock',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  productController.getLowStockProducts
);

// GET /api/products/:productId - Get product by ID (Authenticated users)
router.get(
  '/:productId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  productController.getProductById
);

// POST /api/products - Create new product (Manager and Admin)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  productController.createProduct
);

// PUT /api/products/:productId - Update product by ID (Manager and Admin)
router.put(
  '/:productId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  productController.updateProductById
);

// PATCH /api/products/:productId/stock - Update product stock (Manager and Admin)
router.patch(
  '/:productId/stock',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  productController.updateProductStock
);

// DELETE /api/products/:productId - Soft delete product by ID (Manager and Admin)
router.delete(
  '/:productId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  productController.deleteProductById
);

module.exports = router;