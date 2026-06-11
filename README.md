# Task-Gen-01 - Event Budgeting Platform

An AI-powered event budgeting platform that helps users create and manage budget proposals for events using Google Gemini AI.

## 🚀 Features

- **AI-Powered Budget Generation**: Generate budget proposals using Google Gemini AI
- **Event Management**: Create and manage multiple events with different currencies
- **Budget Item Tracking**: Track budget items by category (Food, Venue, Entertainment, etc.)
- **Proposal Workflow**: Review, approve, or reject AI-generated budget proposals
- **Multi-Workspace Support**: Organize events across different workspaces
- **Real-time Updates**: WebSocket support for live budget updates
- **Authentication & Authorization**: JWT-based authentication with role-based access

## 🛠️ Tech Stack

### Backend
- **NestJS**: Progressive Node.js framework
- **Prisma**: Next-generation ORM
- **SQLite**: Lightweight database (for development)
- **Google Gemini AI**: AI-powered budget generation
- **WebSocket**: Real-time communication
- **JWT**: Authentication
- **Swagger**: API documentation

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Axios**: HTTP client

## 📋 Prerequisites

- Node.js 18+ and npm
- Git

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/hamzaali81/Task-Gen-01.git
cd Task-Gen-01
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your configuration:
# - DATABASE_URL (SQLite is pre-configured)
# - JWT_SECRET (change in production)
# - GEMINI_API_KEY (get from Google AI Studio)

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start the development server
npm run start:dev
```

The backend will be running at `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if needed (default backend URL is http://localhost:3000)

# Start the development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

## 🔑 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste it into your `.env` file

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile

### Events
- `GET /events` - List all events
- `POST /events` - Create a new event
- `GET /events/:id` - Get event details
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Budget Items
- `GET /events/:eventId/budget-items` - List budget items for an event
- `POST /events/:eventId/budget-items` - Create budget item
- `PATCH /events/:eventId/budget-items/:id` - Update budget item
- `DELETE /events/:eventId/budget-items/:id` - Delete budget item

### AI Chat
- `POST /events/:eventId/ai-chat` - Generate budget proposal with AI
- `PATCH /events/:eventId/ai-chat/proposals/:proposalId/approve` - Approve proposal
- `PATCH /events/:eventId/ai-chat/proposals/:proposalId/reject` - Reject proposal

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  workspaces WorkspaceUser[]
}

model Workspace {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  users  WorkspaceUser[]
  events Event[]
}

model Event {
  id          String   @id @default(uuid())
  title       String
  date        DateTime
  currency    String
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  budgetItems   BudgetItem[]
  proposals     BudgetProposal[]
}

model BudgetItem {
  id          String   @id @default(uuid())
  eventId     String
  category    String
  description String
  amount      Float
  currency    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BudgetProposal {
  id              String   @id @default(uuid())
  eventId         String
  userMessage     String
  aiResponse      String
  proposedItems   String
  status          String   @default("pending")
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 🧪 Testing

### Backend

```bash
cd backend
npm test                # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
```

## 📦 Production Deployment

### Backend

For production, consider using MySQL or PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"  // or "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="mysql://user:password@host:3306/database"
```

3. Run migrations:
```bash
npx prisma migrate deploy
```

4. Build and start:
```bash
npm run build
npm run start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Google Gemini AI](https://ai.google.dev/)
- [React](https://react.dev/)

## 📧 Contact

For any questions or support, please open an issue on GitHub.

---

Made with ❤️ by the Task-Gen-01 Team
