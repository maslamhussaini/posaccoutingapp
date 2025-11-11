const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Customer model for database operations
 */
class CustomerModel {
  /**
   * Find customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object|null>} Customer object or null
   */
  async findById(customerId) {
    try {
      return await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          _count: {
            select: { sales: true }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find customer: ${error.message}`);
    }
  }

  /**
   * Find customer by email
   * @param {string} email - Customer email
   * @returns {Promise<Object|null>} Customer object or null
   */
  async findByEmail(email) {
    try {
      return await prisma.customer.findUnique({
        where: { email: email.toLowerCase() }
      });
    } catch (error) {
      throw new Error(`Failed to find customer by email: ${error.message}`);
    }
  }

  /**
   * Get all customers with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of customers per page
   * @param {boolean} includeInactive - Whether to include inactive customers
   * @returns {Promise<Object>} Paginated customers result
   */
  async findAll(page = 1, limit = 10, includeInactive = false) {
    try {
      const skip = (page - 1) * limit;

      const where = includeInactive ? {} : { isActive: true };

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { sales: true }
            }
          },
          orderBy: { name: 'asc' }
        }),
        prisma.customer.count({ where })
      ]);

      return {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async create(customerData) {
    try {
      const customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email ? customerData.email.toLowerCase() : null,
          phone: customerData.phone,
          address: customerData.address
        },
        include: {
          _count: {
            select: { sales: true }
          }
        }
      });

      return customer;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Customer with this email already exists');
      }
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Update customer by ID
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer
   */
  async updateById(customerId, updateData) {
    try {
      // Handle email update with uniqueness check
      if (updateData.email) {
        const existingCustomer = await this.findByEmail(updateData.email);
        if (existingCustomer && existingCustomer.id !== customerId) {
          throw new Error('Customer with this email already exists');
        }
        updateData.email = updateData.email.toLowerCase();
      }

      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: updateData,
        include: {
          _count: {
            select: { sales: true }
          }
        }
      });

      return customer;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Customer not found');
      }
      if (error.message.includes('already exists')) {
        throw error; // Re-throw our custom error
      }
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Delete customer by ID (soft delete)
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Deleted customer
   */
  async deleteById(customerId) {
    try {
      const deletedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: { isActive: false },
        include: {
          _count: {
            select: { sales: true }
          }
        }
      });

      return deletedCustomer;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Customer not found');
      }
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Get customers with sales counts
   * @returns {Promise<Array>} Array of customers with sales counts
   */
  async getCustomersWithSalesCounts() {
    try {
      return await prisma.customer.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { sales: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to get customers with sales counts: ${error.message}`);
    }
  }
}

module.exports = new CustomerModel();