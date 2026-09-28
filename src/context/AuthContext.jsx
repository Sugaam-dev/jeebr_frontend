import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

import { getHomeRouteForRole } from '../utils/authUtils';
export { getHomeRouteForRole };

// Centralized RBAC Permission Matrix
const PERMISSION_MATRIX = {
  'SUPER_ADMIN': {
    canApproveAssurance: true,
    canApproveChurn: true,
    canApproveRevenue: true,
    canApproveOrchestration: true,
    canApproveJourney: true,
    canManageUsers: true,
    canExportAuditLogs: true,
    canTriggerEmergencyRollback: true,
    canViewFieldOps: true,
    canExecuteFieldJobs: true,
    canTrackOwnTicket: true
  },
  'Admin': {
    canApproveAssurance: true,
    canApproveChurn: true,
    canApproveRevenue: true,
    canApproveOrchestration: true,
    canApproveJourney: true,
    canManageUsers: true,
    canExportAuditLogs: true,
    canTriggerEmergencyRollback: true,
    canViewFieldOps: true,
    canExecuteFieldJobs: true,
    canTrackOwnTicket: true
  },
  'NOC': {
    canApproveAssurance: true,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: true,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: true,
    canExecuteFieldJobs: false,
    canTrackOwnTicket: false
  },
  'Care': {
    canApproveAssurance: false,
    canApproveChurn: true,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: true,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: true,
    canExecuteFieldJobs: false,
    canTrackOwnTicket: false
  },
  'Revenue': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: true,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: false,
    canExecuteFieldJobs: false,
    canTrackOwnTicket: false
  },
  'Executive': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: true,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: true,
    canExecuteFieldJobs: false,
    canTrackOwnTicket: false
  },
  'Viewer': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: true,
    canExecuteFieldJobs: false,
    canTrackOwnTicket: false
  },
  'Field Engineer': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: false,
    canExecuteFieldJobs: true,
    canTrackOwnTicket: false
  },
  'Customer': {
    canApproveAssurance: false,
    canApproveChurn: false,
    canApproveRevenue: false,
    canApproveOrchestration: false,
    canApproveJourney: false,
    canManageUsers: false,
    canExportAuditLogs: false,
    canTriggerEmergencyRollback: false,
    canViewFieldOps: false,
    canExecuteFieldJobs: false,
    canTrackOwnTicket: true
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

  // Cross-tab synchronization via storage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'pmrg_user' || e.key === 'pmrg_token') {
        const freshToken = localStorage.getItem('pmrg_token');
        const freshUserStr = localStorage.getItem('pmrg_user');
        setToken(freshToken);
        if (freshUserStr) {
          try {
            setUser(JSON.parse(freshUserStr));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        api.clearCache();
      }
    };

    const handleLogout = () => {
      setUser(null);
      setToken(null);
      setSessionExpired(true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-logout', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  // Revalidate session on initial mount with /auth/me
  useEffect(() => {
    const activeToken = localStorage.getItem('pmrg_token');
    if (!activeToken) return;

    let mounted = true;
    api.getMe()
      .then((meData) => {
        if (!mounted || !meData) return;
        const updatedUser = {
          email: meData.email,
          role: meData.role,
          full_name: meData.full_name || meData.user_name,
          rank: meData.rank,
          permissions: meData.permissions || []
        };
        setUser(updatedUser);
        localStorage.setItem('pmrg_user', JSON.stringify(updatedUser));
      })
      .catch((err) => {
        if (err.status === 401) {
          localStorage.removeItem('pmrg_token');
          localStorage.removeItem('pmrg_user');
          if (mounted) {
            setUser(null);
            setToken(null);
            setSessionExpired(true);
          }
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signup = async (fullName, email, password, role = 'Viewer') => {
    setLoading(true);
    setSessionExpired(false);
    try {
      const data = await api.signup(fullName, email, password, role);
      localStorage.setItem('pmrg_token', data.access_token);
      const userObj = {
        email: data.email,
        role: data.role,
        full_name: data.user_name,
        rank: data.rank,
        permissions: data.permissions || []
      };
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
      const userObj = {
        email: data.email,
        role: data.role,
        full_name: data.user_name,
        rank: data.rank,
        permissions: data.permissions || []
      };
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
      const userObj = {
        email: data.email,
        role: data.role,
        full_name: data.user_name,
        rank: data.rank,
        permissions: data.permissions || []
      };
      localStorage.setItem('pmrg_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Best-effort
    }
    localStorage.removeItem('pmrg_token');
    localStorage.removeItem('pmrg_user');
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    // SUPER_ADMIN and Admin have universal operational access
    if (user.role === 'SUPER_ADMIN' || user.role === 'Admin') return true;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  };

  const can = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    // Check if user has explicit granular permission from backend
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.includes(permissionKey)) {
      return true;
    }
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
