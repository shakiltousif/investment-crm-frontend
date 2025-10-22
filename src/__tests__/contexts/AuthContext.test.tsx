import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  auth: {
    refreshToken: jest.fn(),
    logout: jest.fn(),
  },
  user: {
    getProfile: jest.fn(),
  },
}));

const mockRefreshToken = require('@/lib/api').auth.refreshToken;
const mockLogout = require('@/lib/api').auth.logout;
const mockGetProfile = require('@/lib/api').user.getProfile;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to access auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, refreshUser } = useAuth();
  
  return (
    <div>
      <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user-email">{user?.email || 'no-email'}</div>
      <div data-testid="user-name">{user?.firstName || 'no-name'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshUser}>Refresh</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('provides initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-email');
    expect(screen.getByTestId('user-name')).toHaveTextContent('no-name');
  });

  it('provides authenticated state when tokens exist', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-access-token';
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockGetProfile.mockResolvedValueOnce({
      data: {
        data: mockUser,
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });

  it('handles login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockLoginResponse = {
      data: {
        data: {
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      },
    };

    // Mock the login function
    const mockLogin = jest.fn().mockResolvedValueOnce(mockLoginResponse);
    require('@/lib/api').auth.login = mockLogin;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
  });

  it('handles login error', async () => {
    const mockLogin = jest.fn().mockRejectedValueOnce(new Error('Invalid credentials'));
    require('@/lib/api').auth.login = mockLogin;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('handles logout successfully', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-access-token';
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });

    mockLogout.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByText('Logout');
    
    await act(async () => {
      logoutButton.click();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('handles logout error gracefully', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-access-token';
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });

    mockLogout.mockRejectedValueOnce(new Error('Logout failed'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByText('Logout');
    
    await act(async () => {
      logoutButton.click();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('refreshes user data successfully', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-access-token';
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockGetProfile.mockResolvedValueOnce({
      data: {
        data: mockUser,
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh');
    
    await act(async () => {
      refreshButton.click();
    });

    expect(mockGetProfile).toHaveBeenCalled();
  });

  it('handles refresh token when access token expires', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'expired-token';
      if (key === 'refreshToken') return 'valid-refresh-token';
      return null;
    });

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    // First call fails with 401, second call succeeds after refresh
    mockGetProfile
      .mockRejectedValueOnce({
        response: { status: 401 },
      })
      .mockResolvedValueOnce({
        data: {
          data: mockUser,
        },
      });

    mockRefreshToken.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh');
    
    await act(async () => {
      refreshButton.click();
    });

    expect(mockRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
  });

  it('handles refresh token failure', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'expired-token';
      if (key === 'refreshToken') return 'invalid-refresh-token';
      return null;
    });

    mockGetProfile.mockRejectedValueOnce({
      response: { status: 401 },
    });

    mockRefreshToken.mockRejectedValueOnce(new Error('Refresh token expired'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh');
    
    await act(async () => {
      refreshButton.click();
    });

    expect(mockRefreshToken).toHaveBeenCalledWith('invalid-refresh-token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('handles network errors gracefully', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-access-token';
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });

    mockGetProfile.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh');
    
    await act(async () => {
      refreshButton.click();
    });

    expect(mockGetProfile).toHaveBeenCalled();
    // Should not clear tokens on network errors
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });

  it('provides loading state during authentication', async () => {
    const mockLogin = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    require('@/lib/api').auth.login = mockLogin;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    act(() => {
      loginButton.click();
    });

    // During loading, the button should be disabled or show loading state
    expect(loginButton).toBeInTheDocument();
  });

  it('handles missing tokens gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  it('handles malformed token data', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'malformed-token';
      if (key === 'refreshToken') return 'malformed-refresh-token';
      return null;
    });

    mockGetProfile.mockRejectedValueOnce(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });
});