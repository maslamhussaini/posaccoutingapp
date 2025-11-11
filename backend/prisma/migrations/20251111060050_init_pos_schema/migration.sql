-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('OPENING', 'SALE', 'RETURN', 'DEPOSIT', 'WITHDRAWAL', 'CLOSING');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateTable
CREATE TABLE "postblUsers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblProducts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblProducts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblCategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblSuppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblSuppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblCustomers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblCustomers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblPurchases" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblPurchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblPurchaseItems" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "postblPurchaseItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblSales" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblSales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblSaleItems" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "postblSaleItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblReturns" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblReturns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblReturnItems" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "postblReturnItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblCashRegisters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "openedById" TEXT,
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblCashRegisters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblCashMovements" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postblCashMovements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblAccounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblJournalEntries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postblJournalEntries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postblRefreshTokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postblRefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "postblUsers_email_key" ON "postblUsers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "postblProducts_sku_key" ON "postblProducts"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "postblProducts_barcode_key" ON "postblProducts"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "postblCategories_name_key" ON "postblCategories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "postblSuppliers_email_key" ON "postblSuppliers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "postblCustomers_email_key" ON "postblCustomers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "postblAccounts_code_key" ON "postblAccounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "postblRefreshTokens_token_key" ON "postblRefreshTokens"("token");

-- AddForeignKey
ALTER TABLE "postblProducts" ADD CONSTRAINT "postblProducts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "postblCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblProducts" ADD CONSTRAINT "postblProducts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "postblSuppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblPurchases" ADD CONSTRAINT "postblPurchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "postblSuppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblPurchases" ADD CONSTRAINT "postblPurchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postblUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblPurchaseItems" ADD CONSTRAINT "postblPurchaseItems_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "postblPurchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblPurchaseItems" ADD CONSTRAINT "postblPurchaseItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "postblProducts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblSales" ADD CONSTRAINT "postblSales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "postblCustomers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblSales" ADD CONSTRAINT "postblSales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postblUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblSaleItems" ADD CONSTRAINT "postblSaleItems_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "postblSales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblSaleItems" ADD CONSTRAINT "postblSaleItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "postblProducts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblReturns" ADD CONSTRAINT "postblReturns_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "postblSales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblReturns" ADD CONSTRAINT "postblReturns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postblUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblReturnItems" ADD CONSTRAINT "postblReturnItems_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "postblReturns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblReturnItems" ADD CONSTRAINT "postblReturnItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "postblProducts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblCashRegisters" ADD CONSTRAINT "postblCashRegisters_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "postblUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblCashRegisters" ADD CONSTRAINT "postblCashRegisters_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "postblUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblCashMovements" ADD CONSTRAINT "postblCashMovements_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "postblCashRegisters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblCashMovements" ADD CONSTRAINT "postblCashMovements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postblUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblAccounts" ADD CONSTRAINT "postblAccounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "postblAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblJournalEntries" ADD CONSTRAINT "postblJournalEntries_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "postblAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblJournalEntries" ADD CONSTRAINT "postblJournalEntries_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "postblAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblJournalEntries" ADD CONSTRAINT "postblJournalEntries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postblUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postblRefreshTokens" ADD CONSTRAINT "postblRefreshTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postblUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
