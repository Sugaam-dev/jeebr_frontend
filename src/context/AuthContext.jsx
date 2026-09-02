import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

// Centralized RBAC Permission Matrix
const PERMISSION_MATRIX = {
  'Admin': {
    canApproveAssurance: true,
    canApproveChurn: true,
    canApproveRevenue: true,
    canApproveOrchestration: true,
    canApproveJourney: true,
    canManageUsers: true,
    canExportAuditLogs: true,
    canTriggerEmergencyRollback: true
  },
  'NOC': {
    canApproveAssurance: true,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: true,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false
  },
  'Care': {
    canApproveAssurance: false,
    canApproveChurn: true,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: true,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false
  },
  'Revenue': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: true,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false
  },
  'Executive': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: true,
    canTriggerEmergencyRollback: false
  },
  'Viewer': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pmrg_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pmrg_token'));
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
      setSessionExpired(true);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const signup = async (fullName, email, password, role = 'Viewer') => {
    setLoading(true);
    setSessionExpired(false);
    try {
      const data = await api.signup(fullName, email, password, role);
      localStorage.setItem('pmrg_token', data.access_token);
      const userObj = { email: data.email, role: data.role, full_name: data.user_name };
      localStorage.setItem('pmrg_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setSessionExpired(false);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('pmrg_token', data.access_token);
      const userObj = { email: data.email, role: data.role, full_name: data.user_name };
      localStorage.setItem('pmrg_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    setLoading(true);
    setSessionExpired(false);
    try {
      const data = await api.demoLogin(role);
      localStorage.setItem('pmrg_token', data.access_token);
      const userObj = { email: data.email, role: data.role, full_name: data.user_name };
      localStorage.setItem('pmrg_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pmrg_token');
    localStorage.removeItem('pmrg_user');
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  };

  const can = (permissionKey) => {
    if (!user) return false;
    const rolePermissions = PERMISSION_MATRIX[user.role] || PERMISSION_MATRIX['Viewer'];
    return Boolean(rolePermissions[permissionKey]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      signup,
      demoLogin,
      logout,
      loading,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      hasRole,
      can
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
