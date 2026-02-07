import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId?: number | null;
  companyName?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  requestRegisterCode: (name: string, email: string) => Promise<void>;
  confirmRegister: (name: string, email: string, password: string, code: string) => Promise<void>;
  requestPasswordResetCode: (email: string) => Promise<void>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  trialExpired: boolean;
  trialMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialMessage, setTrialMessage] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const normalizeUser = (data: any): User => ({
    ...data,
    role: typeof data?.role === 'string' ? data.role.toLowerCase().trim() : data?.role,
    companyName: data?.companyName ?? data?.company_name ?? null
  });

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(normalizeUser(response.data));
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.code === 'TRIAL_EXPIRED') {
        localStorage.removeItem('token');
        setToken(null);
        setTrialExpired(true);
        setTrialMessage(error.response?.data?.message || 'Seu periodo de trial expirou. Escolha um plano para continuar.');
        return;
      }
      localStorage.removeItem('token');
      setToken(null);
      return;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      setUser(normalizeUser(user));
      setToken(token);
      localStorage.setItem('token', token);
      await fetchUser();
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw para que o componente possa tratar o erro
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data;
      setUser(normalizeUser(user));
      setToken(token);
      localStorage.setItem('token', token);
      await fetchUser();
    } catch (error: any) {
      console.error('Register error:', error);
      // Re-throw para que o componente possa tratar o erro
      throw error;
    }
  };

  const requestRegisterCode = async (name: string, email: string) => {
    try {
      await api.post('/auth/register/request-code', { name, email });
    } catch (error: any) {
      console.error('Request register code error:', error);
      throw error;
    }
  };

  const confirmRegister = async (name: string, email: string, password: string, code: string) => {
    try {
      const response = await api.post('/auth/register/confirm', {
        name,
        email,
        password,
        verificationCode: code
      });
      const { user, token } = response.data;
      setUser(normalizeUser(user));
      setToken(token);
      localStorage.setItem('token', token);
      await fetchUser();
    } catch (error: any) {
      console.error('Confirm register error:', error);
      throw error;
    }
  };

  const requestPasswordResetCode = async (email: string) => {
    try {
      await api.post('/auth/password/reset/request', { email });
    } catch (error: any) {
      console.error('Request password reset code error:', error);
      throw error;
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    try {
      await api.post('/auth/password/reset/verify', { email, verificationCode: code });
    } catch (error: any) {
      console.error('Verify password reset code error:', error);
      throw error;
    }
  };

  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      await api.post('/auth/password/reset/confirm', {
        email,
        verificationCode: code,
        newPassword
      });
    } catch (error: any) {
      console.error('Confirm password reset error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        requestRegisterCode,
        confirmRegister,
        requestPasswordResetCode,
        verifyPasswordResetCode,
        confirmPasswordReset,
        logout,
        loading,
        trialExpired,
        trialMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

