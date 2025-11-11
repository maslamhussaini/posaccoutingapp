const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../../../auth/middleware/authMiddleware');

/**
 * Supplier routes
 * Base path: /api/suppliers
 */

// GET /api/suppliers - Get all suppliers (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  supplierController.getAllSuppliers
);

// GET /api/suppliers/with-counts - Get suppliers with product counts (Authenticated users)
router.get(
  '/with-counts',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  supplierController.getSuppliersWithProductCounts
);

// GET /api/suppliers/:supplierId - Get supplier by ID (Authenticated users)
router.get(
  '/:supplierId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  supplierController.getSupplierById
);

// POST /api/suppliers - Create new supplier (Manager and Admin)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  supplierController.createSupplier
);

// PUT /api/suppliers/:supplierId - Update supplier by ID (Manager and Admin)
router.put(
  '/:supplierId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  supplierController.updateSupplierById
);

// DELETE /api/suppliers/:supplierId - Soft delete supplier by ID (Manager and Admin)
router.delete(
  '/:supplierId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  supplierController.deleteSupplierById
);

module.exports = router;