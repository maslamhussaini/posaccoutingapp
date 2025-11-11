const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Supplier model for database operations
 */
class SupplierModel {
  /**
   * Find supplier by ID with relations
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<Object|null>} Supplier object or null
   */
  async findById(supplierId) {
    try {
      return await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to find supplier: ${error.message}`);
    }
  }

  /**
   * Find supplier by email
   * @param {string} email - Supplier email
   * @returns {Promise<Object|null>} Supplier object or null
   */
  async findByEmail(email) {
    try {
      return await prisma.supplier.findUnique({
        where: { email: email.toLowerCase() }
      });
    } catch (error) {
      throw new Error(`Failed to find supplier by email: ${error.message}`);
    }
  }

  /**
   * Get all suppliers with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of suppliers per page
   * @param {boolean} includeInactive - Whether to include inactive suppliers
   * @returns {Promise<Object>} Paginated suppliers result
   */
  async findAll(page = 1, limit = 10, includeInactive = false) {
    try {
      const skip = (page - 1) * limit;

      const where = includeInactive ? {} : { isActive: true };

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { products: true }
            }
          },
          orderBy: { name: 'asc' }
        }),
        prisma.supplier.count({ where })
      ]);

      return {
        suppliers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
  }

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier data
   * @returns {Promise<Object>} Created supplier
   */
  async create(supplierData) {
    try {
      const supplier = await prisma.supplier.create({
        data: {
          name: supplierData.name,
          email: supplierData.email ? supplierData.email.toLowerCase() : null,
          phone: supplierData.phone,
          address: supplierData.address
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return supplier;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Supplier with this email already exists');
      }
      throw new Error(`Failed to create supplier: ${error.message}`);
    }
  }

  /**
   * Update supplier by ID
   * @param {string} supplierId - Supplier ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated supplier
   */
  async updateById(supplierId, updateData) {
    try {
      // Handle email update with uniqueness check
      if (updateData.email) {
        const existingSupplier = await this.findByEmail(updateData.email);
        if (existingSupplier && existingSupplier.id !== supplierId) {
          throw new Error('Supplier with this email already exists');
        }
        updateData.email = updateData.email.toLowerCase();
      }

      const supplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: updateData,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return supplier;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Supplier not found');
      }
      if (error.message.includes('already exists')) {
        throw error; // Re-throw our custom error
      }
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
  }

  /**
   * Delete supplier by ID (soft delete)
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<Object>} Deleted supplier
   */
  async deleteById(supplierId) {
    try {
      // Check if supplier has products
      const supplier = await this.findById(supplierId);
      if (supplier._count.products > 0) {
        throw new Error('Cannot delete supplier with associated products');
      }

      const deletedSupplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: { isActive: false },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return deletedSupplier;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Supplier not found');
      }
      throw new Error(`Failed to delete supplier: ${error.message}`);
    }
  }

  /**
   * Get suppliers with product counts
   * @returns {Promise<Array>} Array of suppliers with product counts
   */
  async getSuppliersWithProductCounts() {
    try {
      return await prisma.supplier.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to get suppliers with product counts: ${error.message}`);
    }
  }
}

module.exports = new SupplierModel();