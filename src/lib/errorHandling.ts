import { AxiosError, AxiosResponse } from 'axios';
import { useToastHelpers } from '@/components/ui/Toast';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  code?: string | number;
  timestamp: Date;
}

// Error classification
export function classifyError(error: unknown): AppError {
  const timestamp = new Date();
  
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    // Extract message from various possible locations in the response
    const responseData = error.response?.data;
    let message = error.message;
    if (responseData) {
      // Backend returns { error: { message: "...", statusCode: 401 } }
      if (responseData.error?.message && typeof responseData.error.message === 'string') {
        message = responseData.error.message;
      } else if (responseData.message && typeof responseData.message === 'string') {
        message = responseData.message;
      } else if (typeof responseData.error === 'string') {
        message = responseData.error;
      } else if (typeof responseData === 'string') {
        message = responseData;
      }
    }
    
    switch (status) {
      case 400:
        return {
          type: ErrorType.VALIDATION,
          message: message || 'Invalid request data',
          details: error.response?.data?.details,
          code: status,
          timestamp,
        };
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          message: message || 'Authentication required',
          code: status,
          timestamp,
        };
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          message: message || 'Access denied',
          code: status,
          timestamp,
        };
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: message || 'Resource not found',
          code: status,
          timestamp,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER,
          message: message || 'Server error occurred',
          code: status,
          timestamp,
        };
      default:
        return {
          type: ErrorType.NETWORK,
          message: message || 'Network error occurred',
          code: status,
          timestamp,
        };
    }
  }
  
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      timestamp,
    };
  }
  
  return {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
    details: error,
    timestamp,
  };
}

// User-friendly error messages
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Your session has expired. Please log in again.';
    case ErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.SERVER:
      return 'Something went wrong on our end. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Error handling hook
export function useErrorHandler() {
  const { error: showError } = useToastHelpers();
  
  const handleError = (error: unknown, customMessage?: string) => {
    const appError = classifyError(error);
    const message = customMessage || getUserFriendlyMessage(appError);
    
    // Log error for debugging
    console.error('Error handled:', {
      type: appError.type,
      message: appError.message,
      details: appError.details,
      code: appError.code,
      timestamp: appError.timestamp,
    });
    
    // Show user-friendly error message
    showError('Error', message);
    
    return appError;
  };
  
  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    customMessage?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, customMessage);
      return null;
    }
  };
  
  return {
    handleError,
    handleAsyncError,
    classifyError,
    getUserFriendlyMessage,
  };
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    const error = classifyError(event.reason);
    const message = getUserFriendlyMessage(error);
    
    // Show error to user
    const { error: showError } = useToastHelpers();
    showError('Unexpected Error', message);
    
    // Prevent default browser behavior
    event.preventDefault();
  });
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    const error = classifyError(event.error);
    const message = getUserFriendlyMessage(error);
    
    // Show error to user
    const { error: showError } = useToastHelpers();
    showError('Unexpected Error', message);
  });
}

// Error boundary error handler
export function handleErrorBoundaryError(error: Error, errorInfo: { componentStack?: string }) {
  const appError = classifyError(error);
  
  console.error('Error boundary caught error:', {
    error: appError,
    errorInfo,
    componentStack: errorInfo.componentStack,
  });
  
  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service (e.g., Sentry)
    console.error('Production error:', appError);
  }
  
  return appError;
}

// API error interceptor
export function setupAPIErrorHandling(axiosInstance: { interceptors: { response: { use: (onFulfilled?: unknown, onRejected?: (error: unknown) => unknown) => void } } } }) {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const appError = classifyError(error);
      
      // Log API errors
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        error: appError,
      });
      
      // Handle specific error types
      if (appError.type === ErrorType.AUTHENTICATION) {
        // Redirect to login or refresh token
        window.location.href = '/login';
      }
      
      return Promise.reject(appError);
    }
  );
}

// Type for Axios error response
export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string | { message?: string };
    };
  };
  message?: string;
}

// Safely extract error message from any error type
export function extractErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (!error) {
    return fallback;
  }
  
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }
  
  // PRIORITY 1: Check Axios response data first (most reliable source)
  // This should be checked before error.message to avoid Axios default messages
  const axiosError = error as AxiosErrorResponse;
  if (axiosError?.response?.data) {
    const responseData = axiosError.response.data;
    
    // Backend returns { error: { message: "...", statusCode: 401 } }
    if (responseData?.error) {
      if (typeof responseData.error === 'string') {
        return responseData.error;
      }
      if (responseData.error?.message && typeof responseData.error.message === 'string') {
        return responseData.error.message;
      }
    }
    
    // Check for direct message property in response data
    if (responseData?.message && typeof responseData.message === 'string') {
      return responseData.message;
    }
    
    // Check nested data.message
    if (responseData?.data?.message && typeof responseData.data.message === 'string') {
      return responseData.data.message;
    }
    
    // If response data is a string, use it
    if (typeof responseData === 'string') {
      return responseData;
    }
  }
  
  // PRIORITY 2: Check error.message (but only if it's not a generic Axios message)
  if (axiosError?.message && typeof axiosError.message === 'string') {
    // Skip generic Axios error messages
    const genericMessages = [
      'Request failed with status code',
      'Network Error',
      'timeout of',
      'ECONNREFUSED',
    ];
    
    const isGenericMessage = genericMessages.some((msg) => 
      axiosError.message?.includes(msg)
    );
    
    if (!isGenericMessage && axiosError.message) {
      return axiosError.message;
    }
  }
  
  // PRIORITY 3: Network error (no response)
  if (axiosError?.request && !axiosError?.response) {
    return 'Unable to connect to server. Please check your connection.';
  }
  
  // PRIORITY 4: Last resort - try to convert to string, but use fallback if it's an object
  if (typeof error === 'object') {
    return fallback;
  }
  
  return String(error) || fallback;
}

// Form validation error handler
export function handleFormValidationError(errors: any): string[] {
  const errorMessages: string[] = [];
  
  if (typeof errors === 'object' && errors !== null) {
    for (const field in errors) {
      if (errors.hasOwnProperty(field)) {
        const fieldError = errors[field];
        if (typeof fieldError === 'string') {
          errorMessages.push(`${field}: ${fieldError}`);
        } else if (Array.isArray(fieldError)) {
          errorMessages.push(...fieldError.map((msg: string) => `${field}: ${msg}`));
        }
      }
    }
  }
  
  return errorMessages;
}

// Error reporting utility
export function reportError(error: AppError, context?: any) {
  const errorReport = {
    ...error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
    console.error('Error report:', errorReport);
  } else {
    console.error('Development error report:', errorReport);
  }
}
