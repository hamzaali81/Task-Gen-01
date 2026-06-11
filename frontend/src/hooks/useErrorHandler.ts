import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

/**
 * Centralized error handling hook
 * Provides consistent error messages across the application
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown, fallbackMessage = 'An error occurred') => {
    console.error('Error:', error);

    if (error instanceof AxiosError) {
      // Handle API errors
      const message = error.response?.data?.message || error.message || fallbackMessage;
      const status = error.response?.status;

      switch (status) {
        case 400:
          toast.error(`Validation Error: ${message}`);
          break;
        case 401:
          toast.error('Session expired. Please login again.');
          break;
        case 403:
          toast.error('Access denied. You do not have permission for this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    } else if (error instanceof Error) {
      toast.error(error.message || fallbackMessage);
    } else {
      toast.error(fallbackMessage);
    }
  }, []);

  return { handleError };
};
