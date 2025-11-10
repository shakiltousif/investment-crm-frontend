'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role?: 'CLIENT' | 'ADMIN';
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  kycVerifiedAt?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          await refreshUser();
        }
      } catch (error: any) {
        console.error('Auth check failed:', error);
        // Only clear tokens if it's an authentication error
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Don't set global loading state - component handles its own loading state
      // This prevents page reloads during login
      const response = await api.auth.login({ email, password });
      
      // Handle different response structures
      const responseData = response.data?.data || response.data;
      const { user: userData, accessToken, refreshToken } = responseData;

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid response from server');
      }

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user data - ensure all required fields are present
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber,
          profilePicture: userData.profilePicture,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zipCode,
          country: userData.country,
          role: userData.role || 'CLIENT',
          kycStatus: userData.kycStatus || 'PENDING',
          kycVerifiedAt: userData.kycVerifiedAt,
          isEmailVerified: userData.isEmailVerified || false,
          emailVerifiedAt: userData.emailVerifiedAt,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          lastLoginAt: userData.lastLoginAt,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           'Login failed. Please check your credentials.';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Unable to connect to server. Please check your connection.');
      } else {
        throw new Error(error.message || 'Login failed');
      }
    }
    // Don't set isLoading(false) here - let the component handle it
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await api.auth.register(data);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user data
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.users.getProfile();
      const userData = response.data.data;
      // Ensure role is included and all required fields are present
      setUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber,
        profilePicture: userData.profilePicture,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zipCode,
        country: userData.country,
        role: userData.role || 'CLIENT',
        kycStatus: userData.kycStatus || 'PENDING',
        kycVerifiedAt: userData.kycVerifiedAt,
        isEmailVerified: userData.isEmailVerified || false,
        emailVerifiedAt: userData.emailVerifiedAt,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        lastLoginAt: userData.lastLoginAt,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await api.users.updateProfile(data);
      setUser(response.data.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
