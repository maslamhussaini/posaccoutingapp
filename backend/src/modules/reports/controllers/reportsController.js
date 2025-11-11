const reportsService = require('../services/reportsService');

/**
 * Reports controller for handling report-related HTTP requests
 */
class ReportsController {
  /**
   * Generate sales report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSalesReport(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        userId: req.query.userId,
        customerId: req.query.customerId,
        status: req.query.status
      };

      const report = await reportsService.generateSalesReport(filters);

      res.status(200).json({
        message: 'Sales report generated successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate inventory report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getInventoryReport(req, res, next) {
    try {
      const filters = {
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId,
        lowStock: req.query.lowStock === 'true'
      };

      const report = await reportsService.generateInventoryReport(filters);

      res.status(200).json({
        message: 'Inventory report generated successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate best-seller report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getBestSellerReport(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 20
      };

      const report = await reportsService.generateBestSellerReport(filters);

      res.status(200).json({
        message: 'Best-seller report generated successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Profit & Loss report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfitLossReport(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const report = await reportsService.generateProfitLossReport(filters);

      res.status(200).json({
        message: 'Profit & Loss report generated successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate account balances report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountBalancesReport(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type
      };

      const report = await reportsService.generateAccountBalancesReport(filters);

      res.status(200).json({
        message: 'Account balances report generated successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export report to CSV
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportReport(req, res, next) {
    try {
      const { type, format = 'csv' } = req.params;
      const filters = req.query;

      let reportData;
      let filename;

      // Generate report data based on type
      switch (type) {
        case 'sales':
          reportData = await reportsService.generateSalesReport(filters);
          filename = 'sales-report';
          break;
        case 'inventory':
          reportData = await reportsService.generateInventoryReport(filters);
          filename = 'inventory-report';
          break;
        case 'best-sellers':
          reportData = await reportsService.generateBestSellerReport(filters);
          filename = 'best-sellers-report';
          break;
        default:
          return res.status(400).json({
            error: 'ValidationError',
            message: 'Invalid report type. Supported types: sales, inventory, best-sellers'
          });
      }

      if (format === 'csv') {
        const csv = reportsService.generateCSVExport(type, reportData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);

        res.status(200).send(csv);
      } else {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid export format. Supported formats: csv'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard summary (combination of key metrics)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDashboardSummary(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      // Generate multiple reports in parallel for dashboard
      const [salesReport, inventoryReport, profitLossReport] = await Promise.all([
        reportsService.generateSalesReport(filters),
        reportsService.generateInventoryReport({}),
        reportsService.generateProfitLossReport(filters)
      ]);

      const summary = {
        sales: {
          totalRevenue: salesReport.summary.totalRevenue,
          totalSales: salesReport.summary.totalSales,
          netRevenue: salesReport.summary.netRevenue
        },
        inventory: {
          totalProducts: inventoryReport.summary.totalProducts,
          totalValue: inventoryReport.summary.totalValue,
          lowStockItems: inventoryReport.summary.lowStockItems
        },
        profitLoss: {
          totalRevenue: profitLossReport.summary.totalRevenue,
          totalExpenses: profitLossReport.summary.totalExpenses,
          netProfit: profitLossReport.summary.netProfit,
          profitMargin: profitLossReport.summary.profitMargin
        }
      };

      res.status(200).json({
        message: 'Dashboard summary generated successfully',
        summary,
        period: filters
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportsController();