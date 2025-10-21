import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { api } from '../lib/api';

// Mock the API client
vi.mock('../lib/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const TestComponent = () => {
  const { user, isAuthenticated, login, logout, updateUser } = React.useContext(AuthProvider);
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' })}>Update User</button>
    </div>
  );
};

const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no user and not authenticated', () => {
    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should initialize with user from localStorage', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };
    const mockToken = 'mock-token';

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return mockToken;
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle successful login', async () => {
    const mockLoginResponse = {
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    };

    (api.auth.login as any).mockResolvedValue(mockLoginResponse);

    renderWithAuthProvider(<TestComponent />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith('test@example.com', 'password');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockLoginResponse.data.user));
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle login error', async () => {
    const mockError = new Error('Login failed');
    (api.auth.login as any).mockRejectedValue(mockError);

    renderWithAuthProvider(<TestComponent />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    // Should still show no user after failed login
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    (api.auth.logout as any).mockResolvedValue({});

    renderWithAuthProvider(<TestComponent />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(api.auth.logout).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should handle logout error gracefully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    (api.auth.logout as any).mockRejectedValue(new Error('Logout failed'));

    renderWithAuthProvider(<TestComponent />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(api.auth.logout).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    // Should still logout locally even if API call fails
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should update user data', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    const updateButton = screen.getByText('Update User');
    fireEvent.click(updateButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    }));
  });

  it('should handle token refresh', async () => {
    const mockRefreshResponse = {
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    };

    (api.auth.refresh as any).mockResolvedValue(mockRefreshResponse);

    // Simulate token refresh by calling the refresh function
    const { refreshToken } = await import('../contexts/AuthContext');
    
    // This would typically be called by the API interceptor
    await refreshToken('mock-refresh-token');

    expect(api.auth.refresh).toHaveBeenCalledWith('mock-refresh-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
  });

  it('should handle token refresh error', async () => {
    (api.auth.refresh as any).mockRejectedValue(new Error('Refresh failed'));

    // Simulate token refresh failure
    const { refreshToken } = await import('../contexts/AuthContext');
    
    try {
      await refreshToken('invalid-refresh-token');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Refresh failed');
    }

    expect(api.auth.refresh).toHaveBeenCalledWith('invalid-refresh-token');
  });

  it('should handle malformed user data in localStorage', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'user') return 'invalid-json';
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    // Should handle malformed JSON gracefully
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should handle missing token in localStorage', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return null; // No token
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    // Should not be authenticated without a token
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });
});
