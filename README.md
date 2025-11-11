# Multi-Platform POS System

A comprehensive Point of Sale (POS) system built with modern technologies, supporting web, mobile, and desktop platforms.

## 🚀 Features

- **Multi-platform support**: Web (Next.js), Mobile (Flutter), Desktop (Electron)
- **User Management**: Role-based authentication (Admin, Manager, Cashier)
- **Inventory Management**: Products, categories, suppliers, stock tracking
- **Sales & POS**: Real-time checkout, barcode scanning, discounts
- **Purchase Management**: Supplier purchase orders and stock updates
- **Returns & Exchanges**: Complete return processing workflow
- **Cash Register**: Opening/closing balances, daily summaries
- **Accounting**: Chart of accounts, automatic journal entries
- **Reports**: Sales, inventory, P&L, account balances
- **Responsive Design**: Works seamlessly across all devices

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **Prisma** + **PostgreSQL**
- **JWT** authentication
- **bcrypt** password hashing

### Frontend Platforms
- **Web**: Next.js 14 + Tailwind CSS
- **Mobile**: Flutter (iOS & Android)
- **Desktop**: Electron + Web wrapper

## 📁 Project Structure

```
pos-system/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── modules/        # Business logic modules
│   │   └── config/         # Configuration
│   ├── prisma/             # Database schema & migrations
│   └── docker/             # Docker setup
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # Reusable components
│   │   └── contexts/      # React contexts
├── mobile/                 # Flutter mobile app
│   ├── lib/
│   │   ├── screens/       # App screens
│   │   ├── widgets/       # Reusable widgets
│   │   └── services/      # API services
├── desktop/                # Electron desktop app
│   ├── src/
│   │   ├── main/          # Electron main process
│   │   └── renderer/      # Web content
└── docker/                 # System-wide Docker setup
```

## 🏁 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Flutter SDK (for mobile)
- Docker & Docker Compose

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pos-system
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update database URL in .env
# DATABASE_URL="postgresql://username:password@localhost:5432/pos_database"

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start the server
npm run dev
```

### 3. Web Frontend Setup
```bash
cd ../web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Mobile App Setup
```bash
cd ../mobile

# Install Flutter dependencies
flutter pub get

# Run on connected device/emulator
flutter run
```

### 5. Desktop App Setup
```bash
cd ../desktop

# Install dependencies
npm install

# Start in development mode
npm run dev
```

## 🐳 Docker Deployment

### Full System with Docker
```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up --build

# Or use the backend Docker setup
cd backend
docker-compose up --build
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/pos_database"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

#### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Mobile (.env)
```env
API_BASE_URL=http://10.0.2.2:3001
```

## 📊 Default Credentials

After seeding the database, you can login with:
- **Email**: admin@pos.com
- **Password**: admin123
- **Role**: Admin

## 🚀 Production Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Web Deployment
```bash
cd web
npm run build
npm start
```

### Mobile Build
```bash
cd mobile
flutter build apk  # For Android
flutter build ios  # For iOS
```

### Desktop Build
```bash
cd desktop
npm run dist
```

## 📈 API Documentation

The API server provides comprehensive endpoints for all POS operations:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Products**: `/api/products/*`
- **Sales**: `/api/sales/*`
- **Reports**: `/api/reports/*`

Access the API documentation at `http://localhost:3001/api` when the server is running.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

Built with ❤️ for modern retail businesses