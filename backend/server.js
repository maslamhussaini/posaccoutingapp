// Main server file for POS Backend API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      message: 'POS Backend API is running',
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// API Routes
const authRoutes = require('./src/auth/routes/authRoutes');
const userRoutes = require('./src/modules/users/routes/userRoutes');
const productRoutes = require('./src/modules/products/routes/productRoutes');
const categoryRoutes = require('./src/modules/categories/routes/categoryRoutes');
const supplierRoutes = require('./src/modules/suppliers/routes/supplierRoutes');
// Temporarily comment out routes that may have import issues
// const customerRoutes = require('./src/modules/customers/routes/customerRoutes');
// const purchaseRoutes = require('./src/modules/purchases/routes/purchaseRoutes');
// const saleRoutes = require('./src/modules/sales/routes/saleRoutes');
// const returnRoutes = require('./src/modules/returns/routes/returnRoutes');
// const chartOfAccountsRoutes = require('./src/modules/chart-of-accounts/routes/chartOfAccountsRoutes');
// const journalRoutes = require('./src/modules/journal/routes/journalRoutes');
// const cashRegisterRoutes = require('./src/modules/cash-register/routes/cashRegisterRoutes');
// const customerRoutes = require('./src/modules/customers/routes/customerRoutes');
// const purchaseRoutes = require('./src/modules/purchases/routes/purchaseRoutes');
// const saleRoutes = require('./src/modules/sales/routes/saleRoutes');
// const returnRoutes = require('./src/modules/returns/routes/returnRoutes');
// const chartOfAccountsRoutes = require('./src/modules/chart-of-accounts/routes/chartOfAccountsRoutes');
// const journalRoutes = require('./src/modules/journal/routes/journalRoutes');
// const cashRegisterRoutes = require('./src/modules/cash-register/routes/cashRegisterRoutes');
// const reportsRoutes = require('./src/modules/reports/routes/reportsRoutes');

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount CRUD module routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
// Temporarily comment out route mounting for routes that may have import issues
// app.use('/api/customers', customerRoutes);
// app.use('/api/purchases', purchaseRoutes);
// app.use('/api/sales', saleRoutes);
// app.use('/api/returns', returnRoutes);
// app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
// app.use('/api/journal', journalRoutes);
// app.use('/api/cash-registers', cashRegisterRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/purchases', purchaseRoutes);
// app.use('/api/sales', saleRoutes);
// app.use('/api/returns', returnRoutes);
// app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
// app.use('/api/journal', journalRoutes);
// app.use('/api/cash-registers', cashRegisterRoutes);
// app.use('/api/reports', reportsRoutes);

// API Routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'POS Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
        adminTest: 'GET /api/auth/admin-test',
        managerTest: 'GET /api/auth/manager-test',
        userTest: 'GET /api/auth/user-test'
      },
      users: {
        getAll: 'GET /api/users',
        getById: 'GET /api/users/:userId',
        create: 'POST /api/users',
        update: 'PUT /api/users/:userId',
        delete: 'DELETE /api/users/:userId',
        hardDelete: 'DELETE /api/users/:userId/hard'
      },
      products: {
        getAll: 'GET /api/products',
        getLowStock: 'GET /api/products/low-stock',
        getById: 'GET /api/products/:productId',
        create: 'POST /api/products',
        update: 'PUT /api/products/:productId',
        updateStock: 'PATCH /api/products/:productId/stock',
        delete: 'DELETE /api/products/:productId'
      },
      categories: {
        getAll: 'GET /api/categories',
        getWithCounts: 'GET /api/categories/with-counts',
        getById: 'GET /api/categories/:categoryId',
        create: 'POST /api/categories',
        update: 'PUT /api/categories/:categoryId',
        delete: 'DELETE /api/categories/:categoryId'
      },
      suppliers: {
        getAll: 'GET /api/suppliers',
        getWithCounts: 'GET /api/suppliers/with-counts',
        getById: 'GET /api/suppliers/:supplierId',
        create: 'POST /api/suppliers',
        update: 'PUT /api/suppliers/:supplierId',
        delete: 'DELETE /api/suppliers/:supplierId'
      },
      customers: {
        getAll: 'GET /api/customers',
        getWithCounts: 'GET /api/customers/with-counts',
        getById: 'GET /api/customers/:customerId',
        create: 'POST /api/customers',
        update: 'PUT /api/customers/:customerId',
        delete: 'DELETE /api/customers/:customerId'
      },
      purchases: {
        getAll: 'GET /api/purchases',
        getStats: 'GET /api/purchases/stats',
        getMyPurchases: 'GET /api/purchases/my',
        getBySupplier: 'GET /api/purchases/suppliers/:supplierId',
        getById: 'GET /api/purchases/:id',
        create: 'POST /api/purchases',
        update: 'PUT /api/purchases/:id',
        complete: 'PATCH /api/purchases/:id/complete',
        cancel: 'PATCH /api/purchases/:id/cancel',
        delete: 'DELETE /api/purchases/:id'
      },
      sales: {
        getAll: 'GET /api/sales',
        getStats: 'GET /api/sales/stats',
        scanBarcode: 'GET /api/sales/scan/:barcode',
        calculateTotals: 'POST /api/sales/calculate',
        getById: 'GET /api/sales/:saleId',
        create: 'POST /api/sales',
        updateStatus: 'PATCH /api/sales/:saleId/status'
      },
      returns: {
        getAll: 'GET /api/returns',
        getStats: 'GET /api/returns/stats',
        calculateRefund: 'POST /api/returns/calculate',
        getById: 'GET /api/returns/:returnId',
        create: 'POST /api/returns',
        updateStatus: 'PATCH /api/returns/:returnId/status',
        approve: 'PATCH /api/returns/:returnId/approve',
        reject: 'PATCH /api/returns/:returnId/reject'
      },
      chartOfAccounts: {
        getAll: 'GET /api/chart-of-accounts',
        getHierarchy: 'GET /api/chart-of-accounts/hierarchy',
        getTrialBalance: 'GET /api/chart-of-accounts/trial-balance',
        getByType: 'GET /api/chart-of-accounts/type/:type',
        getByCode: 'GET /api/chart-of-accounts/code/:code',
        getById: 'GET /api/chart-of-accounts/:accountId',
        getAccountBalance: 'GET /api/chart-of-accounts/:accountId/balance',
        create: 'POST /api/chart-of-accounts',
        update: 'PUT /api/chart-of-accounts/:accountId',
        delete: 'DELETE /api/chart-of-accounts/:accountId'
      },
      journal: {
        getAll: 'GET /api/journal',
        getSummary: 'GET /api/journal/summary',
        getById: 'GET /api/journal/:entryId',
        create: 'POST /api/journal',
        update: 'PUT /api/journal/:entryId',
        delete: 'DELETE /api/journal/:entryId',
        getAccountBalance: 'GET /api/journal/accounts/:accountId/balance'
      },
      cashRegisters: {
        getAll: 'GET /api/cash-registers',
        getStatus: 'GET /api/cash-registers/status',
        getDailySummary: 'GET /api/cash-registers/daily-summary',
        create: 'POST /api/cash-registers',
        getById: 'GET /api/cash-registers/:registerId',
        update: 'PUT /api/cash-registers/:registerId',
        delete: 'DELETE /api/cash-registers/:registerId',
        open: 'POST /api/cash-registers/:registerId/open',
        close: 'POST /api/cash-registers/:registerId/close',
        deposit: 'POST /api/cash-registers/:registerId/deposit',
        withdraw: 'POST /api/cash-registers/:registerId/withdraw',
        getMovements: 'GET /api/cash-registers/:registerId/movements',
        getExpectedBalance: 'GET /api/cash-registers/:registerId/expected-balance'
      },
      reports: {
        getDashboard: 'GET /api/reports/dashboard',
        getSalesReport: 'GET /api/reports/sales',
        getInventoryReport: 'GET /api/reports/inventory',
        getBestSellersReport: 'GET /api/reports/best-sellers',
        getProfitLossReport: 'GET /api/reports/profit-loss',
        getAccountBalancesReport: 'GET /api/reports/account-balances',
        exportReport: 'GET /api/reports/export/:type/:format'
      }
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  res.status(error.status || 500).json({
    error: error.name || 'InternalServerError',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 POS Backend API server is running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔗 API info available at: http://localhost:${PORT}/api`);
});

// Export for testing
module.exports = app;