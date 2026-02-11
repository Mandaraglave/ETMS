import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import apiService from '../services/api';
import socketService from '../services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  setAuthState: (token: string, user: User) => void;
  loginWithOtp: (email: string, otp: string, role: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  syncUser: (user: User) => void;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Initialize state: if token exists, we need to validate it first
// So we set isLoading=true and isAuthenticated=false until validation completes
const tokenFromStorage = localStorage.getItem('token');
const initialState: AuthState = {
  user: null,
  token: tokenFromStorage,
  isLoading: !!tokenFromStorage, // Set loading=true if token exists (needs validation)
  isAuthenticated: false, // Don't trust localStorage token until validated
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      console.log('=== INIT AUTH SESSION ===');
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'EXISTS' : 'NULL');
      
      if (token) {
        try {
          console.log('Token found, validating with backend...');
          // isLoading is already true from initialState when token exists
          const response = await apiService.getProfile();
          console.log('Profile response:', response);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.user, token },
          });
          console.log('✅ Auth session restored successfully');
          socketService.connect(response.user.id);
        } catch (error) {
          console.error('❌ Failed to restore auth session:', error);
          console.log('Removing invalid token from localStorage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('No token found, user not authenticated');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('=== AUTH CONTEXT LOGIN ===');
      console.log('Credentials received:', { ...credentials, password: '***' });
      dispatch({ type: 'LOGIN_START' });
      const response = await apiService.login(credentials);
      console.log('API response:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log('Token saved to localStorage:', response.token ? 'YES' : 'NO');
      console.log('Token value:', response.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
      
      console.log('Auth state dispatched, user:', response.user);
      console.log('isAuthenticated should now be true');
      
      socketService.connect(response.user.id);
      console.log('✅ Login completed successfully');
    } catch (error) {
      console.error('❌ Login failed in AuthContext:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const loginWithOtp = async (email: string, otp: string, role: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await apiService.verifyOtp(email, otp, role);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
      socketService.connect(response.user.id);
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await apiService.register(userData);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
      
      socketService.connect(response.user.id);
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: response.user });
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    }
  };

  const syncUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
    localStorage.setItem('user', JSON.stringify(user));
  };

  const setAuthState = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    });
    socketService.connect(user.id);
  };

  const value: AuthContextType = {
    ...state,
    login,
    setAuthState,
    loginWithOtp,
    register,
    logout,
    updateProfile,
    syncUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
