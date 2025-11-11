const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Reports service for generating various business reports
 */
class ReportsService {
  /**
   * Generate sales report with date range and filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Sales report data
   */
  async generateSalesReport(filters = {}) {
    try {
      const where = {};

      // Date range filter
      if (filters.startDate && filters.endDate) {
        where.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      // Additional filters
      if (filters.userId) where.userId = filters.userId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.status) where.status = filters.status;

      // Get sales data with aggregations
      const sales = await prisma.sale.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true }
          },
          user: {
            select: { id: true, firstName: true, lastName: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate summary statistics
      const summary = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
        totalTax: sales.reduce((sum, sale) => sum + sale.tax, 0),
        totalDiscount: sales.reduce((sum, sale) => sum + sale.discount, 0),
        netRevenue: sales.reduce((sum, sale) => sum + (sale.total - sale.tax), 0)
      };

      // Group by date for trend analysis
      const salesByDate = sales.reduce((acc, sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 };
        }
        acc[date].count += 1;
        acc[date].revenue += sale.total;
        return acc;
      }, {});

      return {
        summary,
        sales,
        salesByDate,
        filters: filters
      };
    } catch (error) {
      throw new Error(`Failed to generate sales report: ${error.message}`);
    }
  }

  /**
   * Generate inventory report
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Inventory report data
   */
  async generateInventoryReport(filters = {}) {
    try {
      const where = { isActive: true };

      // Filters
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.supplierId) where.supplierId = filters.supplierId;
      if (filters.lowStock === true) {
        where.stock = {
          lte: prisma.product.fields.minStock
        };
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true }
          },
          supplier: {
            select: { id: true, name: true }
          }
        },
        orderBy: { stock: 'asc' }
      });

      // Calculate inventory statistics
      const summary = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, product) => sum + (product.stock * product.costPrice), 0),
        lowStockItems: products.filter(p => p.stock <= p.minStock).length,
        outOfStockItems: products.filter(p => p.stock === 0).length
      };

      // Group by category
      const inventoryByCategory = products.reduce((acc, product) => {
        const categoryName = product.category?.name || 'Uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, totalStock: 0, totalValue: 0 };
        }
        acc[categoryName].count += 1;
        acc[categoryName].totalStock += product.stock;
        acc[categoryName].totalValue += product.stock * product.costPrice;
        return acc;
      }, {});

      return {
        summary,
        products,
        inventoryByCategory,
        filters
      };
    } catch (error) {
      throw new Error(`Failed to generate inventory report: ${error.message}`);
    }
  }

  /**
   * Generate best-seller report
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Best-seller report data
   */
  async generateBestSellerReport(filters = {}) {
    try {
      const where = {};

      // Date range filter
      if (filters.startDate && filters.endDate) {
        where.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      // Get sale items with product details
      const saleItems = await prisma.saleItem.findMany({
        where: {
          sale: where
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: { select: { name: true } } }
          }
        }
      });

      // Aggregate sales by product
      const productSales = saleItems.reduce((acc, item) => {
        const productId = item.productId;
        if (!acc[productId]) {
          acc[productId] = {
            product: item.product,
            totalQuantity: 0,
            totalRevenue: 0,
            totalSales: 0
          };
        }
        acc[productId].totalQuantity += item.quantity;
        acc[productId].totalRevenue += item.total;
        acc[productId].totalSales += 1;
        return acc;
      }, {});

      // Convert to array and sort by revenue
      const bestSellers = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, filters.limit || 20);

      const summary = {
        totalProducts: Object.keys(productSales).length,
        topProduct: bestSellers[0] || null,
        totalRevenue: bestSellers.reduce((sum, item) => sum + item.totalRevenue, 0)
      };

      return {
        summary,
        bestSellers,
        filters
      };
    } catch (error) {
      throw new Error(`Failed to generate best-seller report: ${error.message}`);
    }
  }

  /**
   * Generate Profit & Loss report
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} P&L report data
   */
  async generateProfitLossReport(filters = {}) {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      // Get revenue accounts (sales)
      const revenueAccounts = await prisma.account.findMany({
        where: { type: 'REVENUE', isActive: true }
      });

      // Get expense accounts
      const expenseAccounts = await prisma.account.findMany({
        where: { type: 'EXPENSE', isActive: true }
      });

      // Calculate balances for revenue accounts
      const revenueBalances = await Promise.all(
        revenueAccounts.map(account =>
          prisma.journalEntry.aggregate({
            where: {
              creditAccountId: account.id,
              ...(startDate && endDate && {
                date: { gte: startDate, lte: endDate }
              })
            },
            _sum: { amount: true }
          }).then(result => ({
            account: account.name,
            balance: result._sum.amount || 0
          }))
        )
      );

      // Calculate balances for expense accounts
      const expenseBalances = await Promise.all(
        expenseAccounts.map(account =>
          prisma.journalEntry.aggregate({
            where: {
              debitAccountId: account.id,
              ...(startDate && endDate && {
                date: { gte: startDate, lte: endDate }
              })
            },
            _sum: { amount: true }
          }).then(result => ({
            account: account.name,
            balance: result._sum.amount || 0
          }))
        )
      );

      const totalRevenue = revenueBalances.reduce((sum, item) => sum + item.balance, 0);
      const totalExpenses = expenseBalances.reduce((sum, item) => sum + item.balance, 0);
      const netProfit = totalRevenue - totalExpenses;

      return {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        revenue: {
          accounts: revenueBalances,
          total: totalRevenue
        },
        expenses: {
          accounts: expenseBalances,
          total: totalExpenses
        },
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        },
        filters
      };
    } catch (error) {
      throw new Error(`Failed to generate P&L report: ${error.message}`);
    }
  }

  /**
   * Generate account balances report
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Account balances report data
   */
  async generateAccountBalancesReport(filters = {}) {
    try {
      const where = { isActive: true };

      if (filters.type) where.type = filters.type;

      const accounts = await prisma.account.findMany({
        where,
        orderBy: [
          { type: 'asc' },
          { code: 'asc' }
        ]
      });

      // Calculate balances for each account
      const accountBalances = await Promise.all(
        accounts.map(async (account) => {
          const balance = await this.calculateAccountBalance(account.id, filters.startDate, filters.endDate);
          return {
            id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            ...balance
          };
        })
      );

      // Group by account type
      const balancesByType = accountBalances.reduce((acc, account) => {
        if (!acc[account.type]) {
          acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
      }, {});

      // Calculate totals by type
      const totalsByType = Object.keys(balancesByType).reduce((acc, type) => {
        const accounts = balancesByType[type];
        acc[type] = {
          totalDebit: accounts.reduce((sum, acc) => sum + acc.debit, 0),
          totalCredit: accounts.reduce((sum, acc) => sum + acc.credit, 0),
          totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0)
        };
        return acc;
      }, {});

      return {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        accounts: accountBalances,
        balancesByType,
        totalsByType,
        summary: {
          totalAccounts: accountBalances.length,
          totalDebit: accountBalances.reduce((sum, acc) => sum + acc.debit, 0),
          totalCredit: accountBalances.reduce((sum, acc) => sum + acc.credit, 0),
          netBalance: accountBalances.reduce((sum, acc) => sum + acc.balance, 0)
        },
        filters
      };
    } catch (error) {
      throw new Error(`Failed to generate account balances report: ${error.message}`);
    }
  }

  /**
   * Calculate account balance with date range
   * @param {string} accountId - Account ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Balance information
   */
  async calculateAccountBalance(accountId, startDate, endDate) {
    try {
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      // Get debit entries
      const debitEntries = await prisma.journalEntry.findMany({
        where: {
          debitAccountId: accountId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        select: { amount: true }
      });

      // Get credit entries
      const creditEntries = await prisma.journalEntry.findMany({
        where: {
          creditAccountId: accountId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        select: { amount: true }
      });

      const totalDebit = debitEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const totalCredit = creditEntries.reduce((sum, entry) => sum + entry.amount, 0);

      return {
        debit: totalDebit,
        credit: totalCredit,
        balance: totalDebit - totalCredit
      };
    } catch (error) {
      throw new Error(`Failed to calculate account balance: ${error.message}`);
    }
  }

  /**
   * Export report to CSV format
   * @param {string} reportType - Type of report
   * @param {Object} data - Report data
   * @returns {string} CSV content
   */
  generateCSVExport(reportType, data) {
    let csv = '';

    switch (reportType) {
      case 'sales':
        csv = 'Date,Customer,User,Total,Tax,Discount,Status\n';
        data.sales.forEach(sale => {
          csv += `${sale.createdAt.toISOString().split('T')[0]},`;
          csv += `"${sale.customer?.name || 'Walk-in'}",`;
          csv += `"${sale.user.firstName} ${sale.user.lastName}",`;
          csv += `${sale.total},${sale.tax},${sale.discount},${sale.status}\n`;
        });
        break;

      case 'inventory':
        csv = 'SKU,Name,Category,Stock,Min Stock,Cost Price,Total Value\n';
        data.products.forEach(product => {
          csv += `${product.sku},"${product.name}","${product.category?.name || ''}",`;
          csv += `${product.stock},${product.minStock},${product.costPrice},`;
          csv += `${product.stock * product.costPrice}\n`;
        });
        break;

      case 'best-sellers':
        csv = 'SKU,Name,Category,Total Quantity,Total Revenue,Total Sales\n';
        data.bestSellers.forEach(item => {
          csv += `${item.product.sku},"${item.product.name}","${item.product.category?.name || ''}",`;
          csv += `${item.totalQuantity},${item.totalRevenue},${item.totalSales}\n`;
        });
        break;

      default:
        throw new Error('Unsupported report type for CSV export');
    }

    return csv;
  }
}

module.exports = new ReportsService();