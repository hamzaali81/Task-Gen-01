import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import './App.css';

/**
 * React Query client configuration
 * Centralized cache and request management
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes (formerly cacheTime)
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Main App Component
 * Provides routing, state management, and error boundaries
 */
function App() {
  const { token } = useAuthStore();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to="/events" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={token ? <Navigate to="/events" replace /> : <Register />}
            />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <EventsList />
                </PrivateRoute>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <PrivateRoute>
                  <EventDetail />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
