# Event Budgeting Platform - Backend API

NestJS backend with Prisma ORM, MySQL, Gemini AI integration, and Socket.IO for real-time updates.

## Tech Stack

- **Framework**: NestJS 10.3
- **Database**: MySQL 8.0
- **ORM**: Prisma 5.8
- **Authentication**: JWT with Passport
- **AI**: Google Gemini API (@google/generative-ai)
- **Real-time**: Socket.IO
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Installation

```bash
npm install
```

## Configuration

Create `.env` file:

```env
DATABASE_URL="mysql://root:password@localhost:3306/event_budgeting"
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h
GEMINI_API_KEY=your-gemini-api-key-here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (dev)
npm run prisma:push

# Create and run migration (prod)
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Running the App

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Documentation

Access Swagger UI at: http://localhost:3000/api/docs

## Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── decorators/        # Custom decorators (GetUser)
│   ├── dto/               # Login, Register DTOs
│   ├── guards/            # JWT guard
│   ├── strategies/        # JWT, Local strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                  # User management
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── events/                 # Event management
│   ├── dto/
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── events.module.ts
├── budget-items/           # Budget item CRUD
│   ├── dto/
│   ├── budget-items.controller.ts
│   ├── budget-items.service.ts
│   └── budget-items.module.ts
├── ai-chat/                # Gemini AI integration
│   ├── dto/
│   ├── ai-chat.controller.ts
│   ├── ai-chat.service.ts
│   └── ai-chat.module.ts
├── websockets/             # Socket.IO gateway
│   ├── websockets.gateway.ts
│   └── websockets.module.ts
├── prisma/                 # Prisma service
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/
│   └── middleware/
│       └── workspace.middleware.ts
├── app.module.ts
└── main.ts
```

## Key Features

### 1. Multi-tenant Architecture
- Workspace-based isolation
- `x-workspace-id` header required for protected routes
- Middleware validates workspace access
- 403 error if user doesn't have access

### 2. AI Budget Assistant
- Gemini Pro model integration
- Generates structured budget proposals
- Validates currency matches event
- Pending approval workflow
- Blocks multiple pending proposals per event

### 3. Real-time Updates
- Socket.IO WebSocket gateway
- JWT authentication for socket connections
- Workspace room-based event routing
- `budgetUpdated` event on proposal approval

### 4. Security
- JWT token authentication
- bcrypt password hashing (10 rounds)
- Input validation with DTOs
- Parameterized queries via Prisma
- CORS configuration
- Workspace access control

## API Endpoints Overview

### Public Routes
- `POST /auth/register` - Create account + workspace
- `POST /auth/login` - Get JWT token

### Protected Routes (Require JWT)
- `GET /auth/profile` - User profile
- `GET /users/workspaces` - User's workspaces

### Workspace Routes (Require JWT + x-workspace-id)
- Events: `/events/*`
- Budget Items: `/events/:eventId/budget-items/*`
- AI Chat: `/events/:eventId/ai-chat/*`

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Lint and Format

```bash
# Lint
npm run lint

# Format
npm run format
```

## Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

## Gemini AI Integration

The AI service uses Google's Gemini Pro model to generate budget proposals:

```typescript
// Example prompt structure
const prompt = `
Event: ${event.title}
Date: ${event.date}
Currency: ${event.currency}

User Request: ${userMessage}

Generate budget proposal as JSON array...
`;

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent(prompt);
```

Key validations:
- All items must use event's currency
- JSON response parsing with error handling
- Proposal saved as pending
- Existing pending proposals block new generation

## WebSocket Implementation

```typescript
// Gateway authentication
@WebSocketGateway({
  cors: { origin: ['http://localhost:5173'] }
})
export class WebsocketsGateway {
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    const payload = this.jwtService.verify(token);
    client.data.userId = payload.sub;
  }

  // Emit to workspace room
  emitBudgetUpdated(workspaceId: string, eventId: string) {
    this.server
      .to(`workspace:${workspaceId}`)
      .emit('budgetUpdated', { eventId });
  }
}
```

## Prisma Schema Highlights

```prisma
// User ↔ Workspace (many-to-many)
model WorkspaceUser {
  userId      String
  workspaceId String
  role        String @default("member")
  
  @@unique([userId, workspaceId])
}

// Event with budget summary
model Event {
  title       String
  date        DateTime
  currency    String
  budgetItems BudgetItem[]
  proposals   BudgetProposal[]
}

// AI proposal workflow
model BudgetProposal {
  proposedItems String  // JSON array
  status        String  // pending, approved, rejected
}
```

## Environment-specific Configuration

### Development
- `synchronize: true` (use for development only)
- Detailed logging enabled
- CORS allows localhost

### Production
- Use migrations instead of push
- Disable detailed logging
- Set strong JWT_SECRET
- Configure production CORS origins
- Use connection pooling

## Common Issues

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Migration Conflicts
```bash
npx prisma migrate reset  # Dev only!
npx prisma migrate deploy
```

### Gemini API Errors
- Verify API key is valid
- Check API quota limits
- Review prompt structure

### WebSocket Connection Issues
- Verify JWT token in auth handshake
- Check CORS configuration
- Ensure client joins workspace room

## Performance Optimization

1. **Database**
   - Indexes on foreign keys
   - Connection pooling
   - Selective field queries

2. **Caching** (Future)
   - Redis for session storage
   - Cache frequently accessed data

3. **Rate Limiting** (Future)
   - Throttle AI requests
   - Protect auth endpoints

## Deployment

### Docker
```bash
docker build -t event-budgeting-api .
docker run -p 3000:3000 --env-file .env event-budgeting-api
```

### Production Checklist
- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Configure production database
- [ ] Enable HTTPS/SSL
- [ ] Setup logging service
- [ ] Configure monitoring
- [ ] Run database migrations
- [ ] Test all endpoints

## License

MIT
