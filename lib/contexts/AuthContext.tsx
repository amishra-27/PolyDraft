'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

// Types
export interface AuthUser {
  id: string;
  fid: number;
  username: string;
  display_name: string | null;
  wallet_address: string | null;
  auth_method: string;
  created_at: string;
  total_leagues: number | null;
  total_points: number | null;
  wins: number | null;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => void;
  refetch: () => Promise<void>;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage (for persistence across page reloads)
  useEffect(() => {
    const savedToken = localStorage.getItem('polydraft-auth-token');
    const savedUser = localStorage.getItem('polydraft-auth-user');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState({
          user,
          token: savedToken,
          isLoading: false,
          error: null,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Error parsing saved auth data:', error);
        clearAuthData();
      }
    }
  }, []);

  const signIn = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get JWT token from MiniKit Quick Auth
      const { token } = await sdk.quickAuth.getToken();
      
      // Verify token with backend and get user data
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3000'}/api/auth`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      // Store token and user data in localStorage for persistence
      localStorage.setItem('polydraft-auth-token', token);
      localStorage.setItem('polydraft-auth-user', JSON.stringify(data.user));

      setState({
        user: data.user,
        token,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        isAuthenticated: false,
      }));
    }
  };

  const signOut = () => {
    clearAuthData();
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });
  };

  const refetch = async () => {
    if (!state.token) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3000'}/api/auth`, {
        headers: { 
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      
      localStorage.setItem('polydraft-auth-user', JSON.stringify(data.user));

      setState(prev => ({
        ...prev,
        user: data.user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('Refetch error:', error);
      clearAuthData();
      setState(prev => ({
        ...prev,
        user: null,
        token: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
        isAuthenticated: false,
      }));
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('polydraft-auth-token');
    localStorage.removeItem('polydraft-auth-user');
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for authenticated requests
export function useAuthenticatedFetch() {
  const { token, signOut } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired or invalid, sign out user
      signOut();
      throw new Error('Authentication expired');
    }

    return response;
  };

  return { authenticatedFetch };
}