Loom: https://www.loom.com/share/0498cddaca7e4207b0dc03b985c70f78
# Event Budgeting Platform

A multi-tenant event budgeting platform with AI-powered budget proposal generation using Google's Gemini API. Built with NestJS, Prisma, MySQL, React, and TypeScript.

## 🎯 Features

### Core Features
- **Multi-tenant Architecture**: Workspace-based isolation with `x-workspace-id` header validation
- **Event Management**: Full CRUD operations for events with title, date, and currency
- **Budget Items**: Complete budget item management per event
- **AI Budget Assistant**: Gemini-powered budget proposal generation with approval workflow
- **Real-time Updates**: Socket.IO integration for live budget updates across clients
- **JWT Authentication**: Secure authentication with workspace access control

### AI Assistant Workflow
1. User sends natural language request (e.g., "Create budget for corporate event with 100 guests")
2. Gemini generates detailed budget proposal
3. Proposal saved as "pending" (not written to database)
4. User reviews proposal with approve/reject options
5. On approval: budget items written to database + real-time notification
6. Currency validation: All items must match event currency

## 🏗 Architecture

```
Frontend (React + TypeScript)
    ↓ HTTP/REST + WebSocket
Backend (NestJS + Prisma)
    ↓ Prisma ORM
Database (MySQL)
```

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Backend

Create `backend/.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/event_budgeting"
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h
GEMINI_API_KEY=your-gemini-api-key-here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Push schema to database (creates tables)
npm run prisma:push

# Or run migrations
npm run prisma:migrate
```

### 4. Start Services

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

## 📊 Database Schema

```prisma
model User {
  id         String          @id @default(uuid())
  email      String          @unique
  password   String
  workspaces WorkspaceUser[]
}

model Workspace {
  id     String          @id @default(uuid())
  name   String
  users  WorkspaceUser[]
  events Event[]
}

model Event {
  id          String           @id @default(uuid())
  title       String
  date        DateTime
  currency    String
  workspaceId String
  budgetItems BudgetItem[]
  proposals   BudgetProposal[]
}

model BudgetItem {
  id          String @id @default(uuid())
  eventId     String
  category    String
  description String
  amount      Float
  currency    String
}

model BudgetProposal {
  id            String @id @default(uuid())
  eventId       String
  userMessage   String
  aiResponse    String
  proposedItems String  // JSON array
  status        String  // pending, approved, rejected
}
```

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user (creates default workspace)
- `POST /auth/login` - Login (returns JWT + workspaces)
- `GET /auth/profile` - Get user profile

### Events (Requires `x-workspace-id` header)
- `GET /events` - List all events in workspace
- `GET /events/:id` - Get event with budget summary
- `POST /events` - Create event
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Budget Items (Requires `x-workspace-id` header)
- `GET /events/:eventId/budget-items` - List budget items
- `POST /events/:eventId/budget-items` - Create budget item
- `PATCH /events/:eventId/budget-items/:id` - Update budget item
- `DELETE /events/:eventId/budget-items/:id` - Delete budget item

### AI Chat (Requires `x-workspace-id` header)
- `POST /events/:eventId/ai-chat` - Generate budget proposal
- `PATCH /events/:eventId/ai-chat/proposals/:id/approve` - Approve proposal
- `PATCH /events/:eventId/ai-chat/proposals/:id/reject` - Reject proposal

## 🧪 Testing the API

### 1. Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John"}'
```

Response includes `access_token` and `workspaces` array.

### 2. Create Event

```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-workspace-id: YOUR_WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"Company Gala","date":"2026-12-31","currency":"USD"}'
```

### 3. Generate AI Proposal

```bash
curl -X POST http://localhost:3000/events/EVENT_ID/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-workspace-id: YOUR_WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"message":"Create budget for corporate party with 100 guests"}'
```

### 4. Approve Proposal

```bash
curl -X PATCH http://localhost:3000/events/EVENT_ID/ai-chat/proposals/PROPOSAL_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-workspace-id: YOUR_WORKSPACE_ID"
```

## 🔌 WebSocket Events

### Client → Server
- `joinWorkspace(workspaceId)` - Join workspace room
- `leaveWorkspace(workspaceId)` - Leave workspace room

### Server → Client
- `budgetUpdated({ eventId, timestamp })` - Emitted when proposal approved

```javascript
// Frontend example
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: yourJwtToken }
});

socket.emit('joinWorkspace', workspaceId);
socket.on('budgetUpdated', ({ eventId }) => {
  // Refresh budget data
});
```

## 🎨 Frontend Features

- **TanStack Query**: Server state management with caching
- **Zustand**: Client state (auth, workspace selection)
- **React Router**: Protected routes
- **Socket.IO Client**: Real-time updates
- **Toast Notifications**: User feedback
- **Responsive Design**: Mobile-friendly UI

## 🐳 Docker Deployment

```bash
# Set Gemini API key
export GEMINI_API_KEY=your-key-here

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access at http://localhost

## 📁 Project Structure

```
Task-Project/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/              # JWT authentication
│   │   ├── users/             # User management
│   │   ├── events/            # Event CRUD
│   │   ├── budget-items/      # Budget item management
│   │   ├── ai-chat/           # Gemini integration
│   │   ├── websockets/        # Socket.IO gateway
│   │   ├── prisma/            # Prisma service
│   │   └── common/middleware/ # Workspace middleware
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/               # API services
│   │   ├── components/        # React components
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # Custom hooks (useSocket)
│   │   ├── store/             # Zustand stores
│   │   └── styles/            # CSS files
│   └── package.json
└── docker-compose.yml
```

## 🔒 Security Features

- JWT token authentication
- Workspace access validation via middleware
- Password hashing with bcrypt (10 rounds)
- CORS configuration
- Input validation with class-validator
- SQL injection prevention (Prisma parameterized queries)
- WebSocket authentication

## 🚨 Important Notes

1. **Pending Proposal Blocking**: Only one pending proposal per event. Must approve/reject before generating new one.
2. **Currency Validation**: AI proposals with mismatched currencies are automatically rejected.
3. **Workspace Isolation**: All event/budget operations require valid `x-workspace-id` header.
4. **Real-time Updates**: Clients must join workspace room via Socket.IO to receive updates.
5. **Gemini API**: Requires valid API key. Get free key at [Google AI Studio](https://makersuite.google.com/app/apikey).

## 📝 Environment Variables

### Backend (.env)
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRATION` - Token expiration (e.g., "24h")
- `GEMINI_API_KEY` - Google Gemini API key
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed origins

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (optional, defaults to http://localhost:3000)

## 🛠 Development Commands

### Backend
```bash
npm run start:dev      # Start with watch mode
npm run build          # Build for production
npm run start:prod     # Start production build
npm run prisma:studio  # Open Prisma Studio (database GUI)
npm run prisma:migrate # Run database migrations
```

### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 📄 License

MIT

## 🤝 Contributing

This is a take-home project. For production use, consider adding:
- Unit and E2E tests
- Rate limiting
- Refresh tokens
- Advanced error handling
- Logging and monitoring
- CI/CD pipeline
- Database migrations strategy

## 📞 Support

For issues or questions, check:
1. API Documentation: http://localhost:3000/api/docs
2. Prisma Studio: `npm run prisma:studio`
3. Backend logs in terminal
4. Browser console for frontend errors

---

Built with ❤️ using NestJS, React, Prisma, and Gemini AI
