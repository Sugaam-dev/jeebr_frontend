import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('jeebr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('jeebr_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('jeebr_token', data.access_token);
      const userObj = { email: data.email, role: data.role, full_name: data.user_name };
      localStorage.setItem('jeebr_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    setLoading(true);
    try {
      const data = await api.demoLogin(role);
      localStorage.setItem('jeebr_token', data.access_token);
      const userObj = { email: data.email, role: data.role, full_name: data.user_name };
      localStorage.setItem('jeebr_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jeebr_token');
    localStorage.removeItem('jeebr_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, demoLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
