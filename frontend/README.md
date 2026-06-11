# Event Budgeting Platform - Frontend

React + TypeScript frontend with TanStack Query, Socket.IO, and real-time updates.

## Tech Stack

- **Framework**: React 18.3
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 5.0
- **State Management**: 
  - Zustand (client state - auth, workspace)
  - TanStack Query (server state - caching, sync)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Notifications**: React Toastify
- **Styling**: CSS Modules

## Installation

```bash
npm install
```

## Running the App

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/                    # API service layer
│   ├── axios.ts           # Axios instance with interceptors
│   ├── authService.ts     # Authentication API
│   ├── eventService.ts    # Events & budget items API
│   └── chatService.ts     # AI chat API
├── components/            # Reusable components
│   ├── Header.tsx         # App header with workspace selector
│   ├── PrivateRoute.tsx   # Protected route wrapper
│   ├── EventModal.tsx     # Create/edit event modal
│   ├── BudgetTable.tsx    # Budget items table
│   └── AiChatPanel.tsx    # AI assistant chat interface
├── pages/                 # Route pages
│   ├── Login.tsx          # Login page
│   ├── Register.tsx       # Registration page
│   ├── EventsList.tsx     # Events list/dashboard
│   └── EventDetail.tsx    # Event detail with budget & AI
├── store/                 # Zustand stores
│   └── authStore.ts       # Auth & workspace state
├── hooks/                 # Custom React hooks
│   └── useSocket.ts       # Socket.IO connection hook
├── styles/                # CSS files
│   ├── Auth.css
│   ├── EventsList.css
│   ├── EventDetail.css
│   ├── BudgetTable.css
│   ├── AiChat.css
│   ├── Modal.css
│   └── Header.css
├── App.tsx                # App router & providers
├── App.css                # Global styles
└── main.tsx               # Entry point
```

## Key Features

### 1. Authentication Flow
- Login/Register pages
- JWT token storage (localStorage via Zustand persist)
- Auto-redirect to events on successful auth
- Token injection in API requests
- Auto-logout on 401 response

### 2. Multi-Workspace Support
- Workspace selector in header
- Current workspace stored in Zustand
- `x-workspace-id` header auto-injected in requests
- Workspace switching triggers page refresh

### 3. Real-time Updates
- Socket.IO connection with JWT auth
- Auto-join workspace room on connect
- Listen for `budgetUpdated` events
- Auto-refetch event/budget data on update

### 4. AI Chat Interface
- Natural language budget request input
- Proposal preview card with line items
- Approve/Reject buttons
- Example prompts for user guidance
- Loading states during AI generation

### 5. State Management

**Zustand (Client State)**:
```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
}
```

**TanStack Query (Server State)**:
- Events list cached per workspace
- Event detail cached with budget summary
- Auto-refetch on workspace change
- Optimistic updates on mutations

## API Integration

### Axios Interceptors

```typescript
// Request interceptor - inject auth headers
api.interceptors.request.use((config) => {
  const { token, currentWorkspace } = useAuthStore.getState();
  config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-workspace-id'] = currentWorkspace.id;
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### TanStack Query Setup

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,  // 30 seconds
    },
  },
});
```

## Socket.IO Integration

```typescript
// useSocket.ts
export const useSocket = () => {
  const { token, currentWorkspace } = useAuthStore();
  
  useEffect(() => {
    const socket = io('http://localhost:3000', {
      auth: { token },
    });
    
    socket.on('connect', () => {
      socket.emit('joinWorkspace', currentWorkspace.id);
    });
    
    return () => socket.disconnect();
  }, [token, currentWorkspace]);
};
```

```typescript
// EventDetail.tsx
const socket = useSocket();

useEffect(() => {
  socket?.on('budgetUpdated', ({ eventId }) => {
    queryClient.invalidateQueries(['event', eventId]);
  });
}, [socket, eventId]);
```

## Component Overview

### EventsList
- Grid layout of event cards
- Shows event title, date, currency, total budget
- Create new event button
- Delete with confirmation
- Click card to navigate to detail

### EventDetail
- Event header with back button
- Budget summary cards (total spend, category breakdown)
- Budget items table
- AI chat panel (toggle show/hide)
- Real-time updates on proposal approval

### AiChatPanel
- Event context display (title, date, currency)
- Chat input with example prompts
- Proposal preview card when generated
- Approve/Reject buttons with loading states
- Blocks new requests while pending proposal exists

### BudgetTable
- Table with category, description, amount columns
- Category badges with color coding
- Currency formatting
- Total row at bottom
- Empty state with AI hint

## Styling

- **Global Styles**: App.css (buttons, forms, utilities)
- **Component Styles**: Individual CSS files
- **Design System**:
  - Primary color: #007bff (blue)
  - Success: #28a745 (green)
  - Danger: #dc3545 (red)
  - Gradient header: Purple gradient
- **Responsive**: Mobile-friendly with grid layouts
- **Animations**: Smooth transitions on hover/focus

## Environment Variables

Create `.env` (optional):

```env
VITE_API_URL=http://localhost:3000
```

Access in code:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

## Build Configuration

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',  // Optional
    },
  },
});
```

## Development Workflow

1. **Start Backend**: Ensure backend is running on port 3000
2. **Start Frontend**: `npm run dev`
3. **Access App**: http://localhost:5173
4. **Register User**: Create account (auto-creates workspace)
5. **Create Event**: Add event with title, date, currency
6. **Use AI**: Generate budget proposal via chat
7. **Approve**: Review and approve proposal
8. **View Update**: Budget table updates in real-time

## Production Build

```bash
# Build
npm run build

# Preview locally
npm run preview

# Deploy dist/ folder
```

### Deployment Options
- **Vercel**: `vercel deploy`
- **Netlify**: Deploy dist/ folder
- **Nginx**: Serve static files from dist/
- **Docker**: See Dockerfile

## Docker Deployment

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## Testing

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Common Issues

### CORS Errors
- Ensure backend CORS allows frontend origin
- Check `x-workspace-id` header is being sent

### Socket Connection Fails
- Verify JWT token is valid
- Check backend Socket.IO CORS configuration
- Ensure token is passed in `auth` handshake

### Query Not Refetching
- Check `queryKey` includes all dependencies
- Verify `enabled` condition is true
- Use `invalidateQueries` to force refetch

### 403 Workspace Error
- Ensure user has access to workspace
- Verify correct `x-workspace-id` in requests
- Check workspace exists in user's workspaces list

## Performance Optimization

1. **Code Splitting**: React.lazy for route components
2. **Query Caching**: TanStack Query 30s stale time
3. **Memo**: React.memo on expensive components
4. **Debounce**: Search inputs, API calls
5. **Virtual Scrolling**: For large lists (future)

## Accessibility

- Semantic HTML (button, nav, header, etc.)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast WCAG AA compliant

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Android

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Bulk budget item import/export
- [ ] Budget templates
- [ ] Email notifications
- [ ] Advanced filtering/sorting
- [ ] Charts and visualizations
- [ ] Offline support (PWA)
- [ ] Unit tests with Vitest
- [ ] E2E tests with Playwright

## License

MIT
