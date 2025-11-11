const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      email: 'admin@pos.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Created admin user:', admin.email);

  // Create default categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Clothing and fashion items' },
    { name: 'Food & Beverages', description: 'Food and drink products' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    { name: 'Books', description: 'Books and educational materials' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  console.log('✅ Created default categories');

  // Create default suppliers
  const suppliers = [
    { name: 'TechCorp', email: 'contact@techcorp.com', phone: '+1234567890', address: '123 Tech Street' },
    { name: 'FashionHub', email: 'info@fashionhub.com', phone: '+1234567891', address: '456 Fashion Ave' },
    { name: 'FoodMart', email: 'sales@foodmart.com', phone: '+1234567892', address: '789 Food Plaza' }
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { email: supplier.email },
      update: {},
      create: supplier
    });
  }

  console.log('✅ Created default suppliers');

  // Create sample products
  const electronicsCategory = await prisma.category.findUnique({ where: { name: 'Electronics' } });
  const clothingCategory = await prisma.category.findUnique({ where: { name: 'Clothing' } });
  const foodCategory = await prisma.category.findUnique({ where: { name: 'Food & Beverages' } });
  const techCorp = await prisma.supplier.findUnique({ where: { email: 'contact@techcorp.com' } });
  const fashionHub = await prisma.supplier.findUnique({ where: { email: 'info@fashionhub.com' } });
  const foodMart = await prisma.supplier.findUnique({ where: { email: 'sales@foodmart.com' } });

  const products = [
    {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      sku: 'WH-001',
      barcode: '1234567890123',
      price: 99.99,
      costPrice: 60.00,
      stock: 50,
      minStock: 10,
      categoryId: electronicsCategory.id,
      supplierId: techCorp.id
    },
    {
      name: 'Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt in various sizes',
      sku: 'TS-001',
      barcode: '1234567890124',
      price: 19.99,
      costPrice: 8.00,
      stock: 100,
      minStock: 20,
      categoryId: clothingCategory.id,
      supplierId: fashionHub.id
    },
    {
      name: 'Organic Coffee Beans',
      description: 'Premium organic coffee beans, 1kg',
      sku: 'CB-001',
      barcode: '1234567890125',
      price: 24.99,
      costPrice: 15.00,
      stock: 30,
      minStock: 5,
      categoryId: foodCategory.id,
      supplierId: foodMart.id
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }

  console.log('✅ Created sample products');

  // Create chart of accounts
  const accounts = [
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '1200', name: 'Inventory', type: 'ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
    { code: '5100', name: 'Operating Expenses', type: 'EXPENSE' }
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account
    });
  }

  console.log('✅ Created chart of accounts');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });