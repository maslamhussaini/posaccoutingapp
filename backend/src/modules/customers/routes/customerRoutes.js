const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../../auth/middleware/authMiddleware');

/**
 * Customer routes
 * Base path: /api/customers
 */

// GET /api/customers - Get all customers (Authenticated users)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  customerController.getAllCustomers
);

// GET /api/customers/with-counts - Get customers with sales counts (Authenticated users)
router.get(
  '/with-counts',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  customerController.getCustomersWithSalesCounts
);

// GET /api/customers/:customerId - Get customer by ID (Authenticated users)
router.get(
  '/:customerId',
  authMiddleware.authenticate,
  authMiddleware.authenticatedOnly,
  customerController.getCustomerById
);

// POST /api/customers - Create new customer (Manager and Admin)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  customerController.createCustomer
);

// PUT /api/customers/:customerId - Update customer by ID (Manager and Admin)
router.put(
  '/:customerId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  customerController.updateCustomerById
);

// DELETE /api/customers/:customerId - Soft delete customer by ID (Manager and Admin)
router.delete(
  '/:customerId',
  authMiddleware.authenticate,
  authMiddleware.managerAndAbove,
  customerController.deleteCustomerById
);

module.exports = router;