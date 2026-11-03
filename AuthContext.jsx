// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AUTHORIZED_EMAIL = 'hr.cbe@datapage.org';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dp_hire_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.authorized && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [token]);

  const loginWithGoogle = async (googleUser) => {
    setAuthError(null);
    try {
      const res = await api.loginGoogle(googleUser);
      if (res.token) {
        localStorage.setItem('dp_hire_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res;
      }
    } catch (err) {
      setAuthError(err.message || 'Access Denied – You are not an authorized user.');
      throw err;
    }
  };

  const loginAsAuthorizedHr = async () => {
    setAuthError(null);
    try {
      const res = await api.loginHrDirect();
      if (res.token) {
        localStorage.setItem('dp_hire_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const testUnauthorized = async (testEmail = 'candidate.user@gmail.com') => {
    setAuthError(null);
    try {
      await api.testUnauthorizedLogin(testEmail);
    } catch (err) {
      const msg = err.message || 'Access Denied – You are not an authorized user.';
      setAuthError(msg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('dp_hire_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && user.email?.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase()),
        isLoading,
        authError,
        setAuthError,
        loginWithGoogle,
        loginAsAuthorizedHr,
        testUnauthorized,
        logout,
        authorizedEmail: AUTHORIZED_EMAIL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
