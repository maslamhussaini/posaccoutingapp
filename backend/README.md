# POS Backend API

A Node.js backend API for a Point of Sale (POS) system built with Express.js, Prisma ORM, and PostgreSQL.

## Features

- **User Management**: Authentication and authorization with role-based access (Admin, Manager, Cashier)
- **Product Management**: CRUD operations for products, categories, and suppliers
- **Sales & Purchases**: Transaction management with detailed item tracking
- **Returns & Exchanges**: Handle customer returns and refunds
- **Cash Register**: Manage cash register operations
- **Accounting**: Chart of accounts and journal entries for financial tracking
- **Reports**: Comprehensive reporting capabilities

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   ├── modules/              # Business logic modules
│   │   ├── users/           # User management
│   │   ├── products/        # Product management
│   │   ├── categories/      # Category management
│   │   ├── suppliers/       # Supplier management
│   │   ├── customers/       # Customer management
│   │   ├── purchases/       # Purchase transactions
│   │   ├── sales/           # Sales transactions
│   │   ├── returns/         # Returns and exchanges
│   │   ├── cash-register/   # Cash register operations
│   │   ├── chart-of-accounts/ # Chart of accounts
│   │   ├── journal/         # Journal entries
│   │   └── reports/         # Reporting module
│   ├── config/              # Configuration files
│   ├── utils/               # Utility functions
│   ├── middleware/          # Global middleware
│   ├── routes/              # Main routing
│   └── app.js               # Main application file
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── docker/                  # Docker setup
├── .env.example             # Environment variables template
├── package.json
├── server.js                # Entry point
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database URL and other configuration.

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Check API and database status

### API Information
- `GET /api` - Get API information and available endpoints

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000 |

## Database Schema

The application uses Prisma ORM with the following main models:
- **User**: System users with roles
- **Product**: Inventory items
- **Category**: Product categories
- **Supplier**: Product suppliers
- **Customer**: Sales customers
- **Purchase/Sale**: Transaction records
- **Return**: Return transactions
- **CashRegister**: Cash management
- **Account**: Chart of accounts
- **JournalEntry**: Accounting entries

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database

## Docker Support

The backend includes Docker configuration for containerized deployment.

```bash
# Build and run with Docker Compose
cd docker
docker-compose up --build
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization

## Contributing

1. Follow the existing project structure
2. Write modular, well-commented code
3. Add appropriate error handling
4. Update documentation as needed
5. Test your changes thoroughly

## License

This project is licensed under the MIT License.