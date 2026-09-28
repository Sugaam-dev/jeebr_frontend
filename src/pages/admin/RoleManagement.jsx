import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  Users,
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Lock,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  Sliders,
  Check,
  UserPlus,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const MARKET_LOCALITIES = {
  mumbai: [
    'Bandra West', 'Andheri East', 'BKC', 'Powai', 
    'Lower Parel', 'Dadar', 'Malad West', 'Thane West',
    'Juhu', 'Worli', 'Borivali', 'Ghatkopar'
  ],
  kolkata: [
    'Salt Lake Sector V', 'Park Street', 'New Town', 'Ballygunge',
    'Howrah', 'Jadavpur', 'Behala', 'Dum Dum',
    'Alipore', 'Gariahat', 'Rajarhat', 'Shyambazar'
  ]
};

export function RoleManagement({ defaultTab }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = defaultTab || searchParams.get('tab') || 'roles';

  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || (user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'Admin' || (user?.role || '').toUpperCase() === 'ADMIN';

  const [roles, setRoles] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'roles' | 'users' | 'permissions'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // -------------------------------------------------------------
  // USER PROVISIONING STATE
  // -------------------------------------------------------------
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: '',
    is_active: true
  });
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createdUserSummary, setCreatedUserSummary] = useState(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    role: '',
    is_active: true
  });
  const [editUserSubmitting, setEditUserSubmitting] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // View User Details State
  const [viewingUser, setViewingUser] = useState(null);

  // Quick Role Assign State
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Quick Status Toggle State
  const [statusTogglingId, setStatusTogglingId] = useState(null);

  // -------------------------------------------------------------
  // ROLE MANAGEMENT STATE
  // -------------------------------------------------------------
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    rank: 50,
    permissions: []
  });
  const [createRoleSubmitting, setCreateRoleSubmitting] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRoleSubmitting, setEditRoleSubmitting] = useState(false);

  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteRoleSubmitting, setDeleteRoleSubmitting] = useState(false);

  // -------------------------------------------------------------
  // DATA LOADING
  // -------------------------------------------------------------
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [rolesData, assignableData, permsData, usersData] = await Promise.all([
        api.getRoles(),
        api.getAssignableRoles ? api.getAssignableRoles().catch(() => []) : Promise.resolve([]),
        api.getPermissions(),
        api.getUsers()
      ]);
      setRoles(rolesData || []);
      
      // Fallback role filtering if assignableData is empty
      let validAssignable = assignableData && assignableData.length > 0 ? assignableData : (rolesData || []);
      if (!isSuperAdmin) {
        validAssignable = validAssignable.filter(
          (r) => r.name !== 'SUPER_ADMIN' && r.name !== 'Admin' && (r.rank || 0) < 80
        );
      }
      setAssignableRoles(validAssignable);
      setPermissions(permsData || []);
      setUsersList(usersData || []);

      // Default role for new user
      if (validAssignable.length > 0 && !newUser.role) {
        setNewUser((prev) => ({ ...prev, role: validAssignable[0].name }));
      }
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
      showFeedback('error', err.message || 'Failed to load RBAC configuration.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4500);
  };

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const groups = {};
    permissions.forEach((p) => {
      const cat = p.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [permissions]);

  // -------------------------------------------------------------
  // USER PROVISIONING HANDLERS
  // -------------------------------------------------------------
  const openCreateUserModal = () => {
    const defaultR = assignableRoles.length > 0 ? assignableRoles[0].name : 'Viewer';
    const currentMarket = localStorage.getItem('mso_market') || 'mumbai';
    setNewUser({
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: defaultR,
      is_active: true,
      phone: '+91 98200 12345',
      market_id: currentMarket,
      region: currentMarket === 'kolkata' ? 'Salt Lake Sector V' : 'Bandra West'
    });
    setCreateUserError('');
    setIsCreateUserModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');

    if (!newUser.full_name.trim()) {
      setCreateUserError('Full Name is required.');
      return;
    }
    if (!newUser.email.trim()) {
      setCreateUserError('Email / User ID is required.');
      return;
    }
    if (newUser.password.length < 6) {
      setCreateUserError('Password must be at least 6 characters in length.');
      return;
    }
    if (newUser.password !== newUser.confirm_password) {
      setCreateUserError('Passwords do not match. Please verify your password confirmation.');
      return;
    }
    if (!newUser.role) {
      setCreateUserError('Please select a valid role.');
      return;
    }

    // Defensive frontend hierarchy check
    if (!isSuperAdmin) {
      if (newUser.role === 'SUPER_ADMIN' || newUser.role === 'Admin') {
        setCreateUserError('You are not authorized to create a user with this role.');
        return;
      }
    }

    setCreateUserSubmitting(true);
    try {
      const payload = {
        name: newUser.full_name.trim(),
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        role: newUser.role,
        is_active: newUser.is_active,
        phone: newUser.phone?.trim() || '+91 98200 12345',
        region: newUser.region || (newUser.market_id === 'kolkata' ? 'Salt Lake Sector V' : 'Bandra West'),
        market_id: newUser.market_id || 'mumbai'
      };

      const createdUser = await api.adminCreateUser(payload);

      // Display Section 20 success summary (without exposing password)
      setCreatedUserSummary({
        name: createdUser.full_name || payload.full_name,
        email: createdUser.email || payload.email,
        role: createdUser.role || payload.role,
        status: createdUser.is_active ? 'Active' : 'Disabled'
      });

      setIsCreateUserModalOpen(false);
      showFeedback('success', `User '${payload.full_name}' successfully provisioned!`);
      await loadData();
    } catch (err) {
      console.error('Create user error:', err);
      const msg = err.message || 'Failed to create user account.';
      if (msg.includes('already exists') || msg.includes('409') || msg.includes('Conflict')) {
        setCreateUserError('A user with this email/user ID already exists.');
      } else {
        setCreateUserError(msg);
      }
    } finally {
      setCreateUserSubmitting(false);
    }
  };

  // Edit User Handlers
  const openEditUserModal = (u) => {
    setEditingUser(u);
    setEditUserForm({
      full_name: u.full_name || '',
      role: u.role || '',
      is_active: u.is_active !== false
    });
    setEditUserError('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError('');

    if (!editUserForm.full_name.trim()) {
      setEditUserError('Full name cannot be empty.');
      return;
    }

    // Hierarchy check
    if (!isSuperAdmin) {
      if (editUserForm.role === 'SUPER_ADMIN' || editUserForm.role === 'Admin') {
        if (editUserForm.role !== editingUser.role) {
          setEditUserError('You are not authorized to assign this role.');
          return;
        }
      }
    }

    setEditUserSubmitting(true);
    try {
      if (api.adminUpdateUser) {
        await api.adminUpdateUser(editingUser.id, {
          full_name: editUserForm.full_name.trim(),
          role: editUserForm.role,
          is_active: editUserForm.is_active
        });
      } else {
        // Fallback to role assign
        if (editUserForm.role !== editingUser.role) {
          await api.assignUserRole(editingUser.id, editUserForm.role);
        }
      }
      showFeedback('success', `User '${editingUser.email}' updated successfully!`);
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setEditUserError(err.message || 'Failed to update user.');
    } finally {
      setEditUserSubmitting(false);
    }
  };

  // Quick Status Toggle (Disable/Enable User)
  const handleToggleUserStatus = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showFeedback('error', 'Cannot disable your own user account.');
      return;
    }
    if (targetUser.role === 'SUPER_ADMIN' && !isSuperAdmin) {
      showFeedback('error', 'Only Super Administrator can modify Super Admin accounts.');
      return;
    }

    const nextState = !targetUser.is_active;
    setStatusTogglingId(targetUser.id);
    try {
      if (api.toggleUserStatus) {
        await api.toggleUserStatus(targetUser.id, nextState);
      } else if (api.adminUpdateUser) {
        await api.adminUpdateUser(targetUser.id, { is_active: nextState });
      }
      showFeedback(
        'success',
        `User ${targetUser.email} account ${nextState ? 'activated' : 'disabled'}.`
      );
      await loadData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update user status.');
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Quick Role Assign Handlers
  const openAssignModal = (u) => {
    setAssigningUser(u);
    setSelectedRoleForUser(u.role || '');
  };

  const handleAssignUserRole = async (e) => {
    e.preventDefault();
    if (!assigningUser || !selectedRoleForUser) return;
    setAssignSubmitting(true);
    try {
      await api.assignUserRole(assigningUser.id, selectedRoleForUser);
      showFeedback('success', `Assigned role '${selectedRoleForUser}' to ${assigningUser.email}.`);
      setAssigningUser(null);
      await loadData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to assign role.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CUSTOM ROLE HANDLERS
  // -------------------------------------------------------------
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      showFeedback('error', 'Role identifier is required.');
      return;
    }
    setCreateRoleSubmitting(true);
    try {
      await api.createCustomRole({
        name: newRole.name.trim().toUpperCase().replace(/\s+/g, '_'),
        display_name: newRole.display_name.trim() || newRole.name.trim(),
        description: newRole.description.trim(),
        rank: Number(newRole.rank),
        permissions: newRole.permissions
      });
      showFeedback('success', `Custom role '${newRole.name}' successfully created!`);
      setIsCreateRoleModalOpen(false);
      setNewRole({
        name: '',
        display_name: '',
        description: '',
        rank: 50,
        permissions: []
      });
      await loadData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to create role.');
    } finally {
      setCreateRoleSubmitting(false);
    }
  };

  const openEditRoleModal = (role) => {
    setEditingRole(role);
    setEditDisplayName(role.display_name || role.name);
    setEditDescription(role.description || '');
    setEditPermissions([...(role.permissions || [])]);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingRole) return;
    setEditRoleSubmitting(true);
    try {
      await api.updateCustomRole(editingRole.id, {
        display_name: editDisplayName.trim(),
        description: editDescription.trim(),
        permissions: editPermissions
      });
      showFeedback('success', `Role '${editingRole.display_name || editingRole.name}' permissions updated!`);
      setEditingRole(null);
      await loadData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update role.');
    } finally {
      setEditRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleteRoleSubmitting(true);
    try {
      await api.deleteCustomRole(deletingRole.id);
      showFeedback('success', `Role '${deletingRole.display_name || deletingRole.name}' removed.`);
      setDeletingRole(null);
      await loadData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to delete role.');
    } finally {
      setDeleteRoleSubmitting(false);
    }
  };

  // Permission selection helpers
  const toggleCreatePerm = (code) => {
    setNewRole((prev) => {
      const exists = prev.permissions.includes(code);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((c) => c !== code)
          : [...prev.permissions, code]
      };
    });
  };

  const toggleEditPerm = (code) => {
    setEditPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAllCategory = (cat, isEdit = false) => {
    const permsInCat = (permissionsByCategory[cat] || []).map((p) => p.code);
    if (isEdit) {
      setEditPermissions((prev) => Array.from(new Set([...prev, ...permsInCat])));
    } else {
      setNewRole((prev) => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...permsInCat]))
      }));
    }
  };

  const clearCategory = (cat, isEdit = false) => {
    const permsInCat = new Set((permissionsByCategory[cat] || []).map((p) => p.code));
    if (isEdit) {
      setEditPermissions((prev) => prev.filter((c) => !permsInCat.has(c)));
    } else {
      setNewRole((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((c) => !permsInCat.has(c))
      }));
    }
  };

  // -------------------------------------------------------------
  // FILTERING
  // -------------------------------------------------------------
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.display_name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const q = searchQuery.toLowerCase();
    return usersList.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-mono text-xs">Loading hierarchical RBAC schema...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <Breadcrumbs
        items={[
          { label: 'System Administration', icon: Shield },
          { label: 'Role & Permission Configuration', icon: ShieldCheck }
        ]}
        backTo="/dashboard/cockpit"
        backLabel="Operations Cockpit"
      />

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-[#0F225A] via-[#142A6F] to-[#1E3A8A] border border-[#244299] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-mono font-semibold">
            <KeyRound className="w-3.5 h-3.5 text-blue-300" />
            <span>AUTHORITATIVE ACCESS CONTROL MATRIX</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Roles & Permissions Architecture</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Active: {user?.role}
            </span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Provision user accounts, configure hierarchical RBAC boundaries, manage system and custom operational roles, and enforce privilege boundaries across Sentinel OS modules.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <button
              onClick={openCreateUserModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border shadow-sm transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 card-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Managed Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{usersList.length}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {usersList.filter((u) => u.is_active !== false).length} active accounts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 card-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>System Roles</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {roles.filter((r) => r.is_system).length}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">Immutable root anchors</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 card-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Custom Roles</span>
            <Sliders className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {roles.filter((r) => !r.is_system).length}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">Configurable operational</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 card-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Controlled Permissions</span>
            <KeyRound className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{permissions.length}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">Granular action codes</div>
        </div>
      </div>

      {/* Tab Navigation & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Roles ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Permissions ({permissions.length})</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'users'
                ? 'Search users by name, email, role...'
                : activeTab === 'roles'
                ? 'Search roles by name or scope...'
                : 'Search permissions by name, code...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: ROLES TAB                                      */}
      {/* ========================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {/* Hierarchy Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600 font-mono">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Privilege Tier Hierarchy:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                SUPER_ADMIN (Rank 100)
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                ADMIN (Rank 80)
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                OPERATIONAL ROLES (&lt; 80)
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold border border-slate-300">
                VIEWER / CUSTOMER (Rank 10)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoles.map((role) => {
              const isSuper = role.rank === 100 || role.name === 'SUPER_ADMIN';
              const isAdminRole = role.rank === 80 || role.name === 'Admin';
              const canEditThisRole = isAdmin && (!role.is_system || (!isSuper && isSuperAdmin));

              return (
                <div
                  key={role.id || role.name}
                  className="bg-white border border-slate-200 rounded-2xl p-5 card-shadow flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {role.display_name || role.name}
                          </h3>
                          {role.is_system ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                              SYSTEM
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 font-semibold">
                          ID: {role.name}
                        </div>
                      </div>

                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          isSuper
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : isAdminRole
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Rank {role.rank}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                      {role.description || 'Configurable operational access profile.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                        <span>Effective Permissions:</span>
                        <span className="font-bold text-slate-800">
                          {isSuper ? 'ALL (Bypass)' : `${role.permissions?.length || 0} granted`}
                        </span>
                      </div>

                      {isSuper ? (
                        <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900 font-mono">
                          ★ Complete system authority across all modules & database objects.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              No explicit permissions granted.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {role.is_system ? 'Protected System Role' : 'Custom Operational Role'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {canEditThisRole && (
                        <button
                          onClick={() => openEditRoleModal(role)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Configure Permissions"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Configure</span>
                        </button>
                      )}

                      {!role.is_system && isAdmin && (
                        <button
                          onClick={() => setDeletingRole(role)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: USERS TAB (USER MANAGEMENT)                    */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Creation Summary Card (Section 20) */}
          {createdUserSummary && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>User created successfully</span>
                </div>
                <button
                  onClick={() => setCreatedUserSummary(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-1 text-xs font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-white/70 p-3 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                  <span className="text-slate-900 font-bold text-sm">{createdUserSummary.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">User ID / Email</span>
                  <span className="text-slate-900 font-semibold">{createdUserSummary.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Role</span>
                  <span className="text-blue-700 font-bold">{createdUserSummary.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-emerald-700 font-bold">{createdUserSummary.status}</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700">
                Initial password securely hashed and persisted. The user can now authenticate normally through the login portal.
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>User Directory & Credentials Management</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                    {usersList.length} accounts
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage active personnel, provision initial credentials, assign hierarchical roles, and control account status.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={openCreateUserModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start md:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 font-bold text-slate-700">Name</th>
                    <th className="py-3 px-4 font-bold text-slate-700">Email / User ID</th>
                    <th className="py-3 px-4 font-bold text-slate-700">Role</th>
                    <th className="py-3 px-4 font-bold text-slate-700 text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-slate-700 text-center">Privilege Rank</th>
                    <th className="py-3 px-4 font-bold text-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredUsers.map((u) => {
                    const roleObj = roles.find((r) => r.name === u.role);
                    const rank = roleObj?.rank || (u.role === 'SUPER_ADMIN' ? 100 : u.role === 'Admin' ? 80 : 10);
                    const isSuperUser = u.role === 'SUPER_ADMIN' || rank === 100;
                    const isSelf = u.id === user?.id;
                    const isActive = u.is_active !== false;

                    const canManageThisUser = isAdmin && (!isSuperUser || isSuperAdmin);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">
                          {u.full_name || u.email.split('@')[0]}
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isSuperUser
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.role === 'Admin'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Disabled</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {rank}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* View Details */}
                            <button
                              onClick={() => setViewingUser(u)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                              title="View User Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </button>

                            {/* Edit User */}
                            {canManageThisUser && (
                              <button
                                onClick={() => openEditUserModal(u)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            )}

                            {/* Reassign Role Quick Action */}
                            {canManageThisUser && (
                              <button
                                onClick={() => openAssignModal(u)}
                                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Change Role"
                              >
                                <KeyRound className="w-3 h-3 text-slate-500" />
                                <span>Role</span>
                              </button>
                            )}

                            {/* Disable / Enable User Toggle */}
                            {canManageThisUser && !isSelf && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={statusTogglingId === u.id}
                                className={`px-2 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  isActive
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={isActive ? 'Disable User' : 'Enable User'}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="w-3 h-3 text-amber-600" />
                                    <span>Disable</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Enable</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: PERMISSIONS TAB (REGISTRY & MATRIX)            */}
      {/* ========================================================= */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Authoritative RBAC Permission Registry & Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Direct cross-examination of operational permissions mapped against Sentinel OS roles.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Granted</span>
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-slate-300" />
                <span>Denied</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 font-bold text-slate-700 min-w-[240px]">
                    Permission Name & Code
                  </th>
                  <th className="py-3 px-3 font-bold text-slate-700">Category</th>
                  {roles.map((r) => (
                    <th
                      key={r.id || r.name}
                      className="py-3 px-3 font-bold text-slate-800 text-center min-w-[90px]"
                    >
                      <div className="font-bold">{r.display_name || r.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">R:{r.rank}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-slate-50/70">
                      <td
                        colSpan={roles.length + 2}
                        className="py-2 px-4 font-bold text-[11px] uppercase tracking-wider text-blue-800 bg-blue-50/60"
                      >
                        {category} Module ({perms.length} actions)
                      </td>
                    </tr>
                    {perms.map((p) => (
                      <tr key={p.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.code}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {p.category}
                          </span>
                        </td>
                        {roles.map((r) => {
                          const isSuper = r.rank === 100 || r.name === 'SUPER_ADMIN';
                          const hasPerm = isSuper || (r.permissions && r.permissions.includes(p.code));

                          return (
                            <td key={r.id || r.name} className="py-2.5 px-3 text-center">
                              {hasPerm ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-300">
                                  &bull;
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE USER (CORE PROVISIONING WORKFLOW)           */}
      {/* ========================================================= */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span>Create User</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provision initial credentials and assign an authorized role.
                </p>
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {createUserError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createUserError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email / User ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email / User ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 font-mono">
                  Canonical authentication login identifier
                </p>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={newUser.confirm_password}
                    onChange={(e) => setNewUser({ ...newUser, confirm_password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Hierarchy-Aware Role Selection (Section 5 & 13) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Role <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                    {isSuperAdmin ? 'Super Admin scope' : 'Admin: rank < 80'}
                  </span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                >
                  {assignableRoles.map((r) => {
                    // Strict defensive UI filtering
                    if (!isSuperAdmin && (r.name === 'SUPER_ADMIN' || r.name === 'Admin' || (r.rank || 0) >= 80)) {
                      return null;
                    }
                    return (
                      <option key={r.id || r.name} value={r.name}>
                        {r.display_name || r.name} (Rank: {r.rank})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400">
                  User will automatically inherit the module permissions attached to this role.
                </p>
              </div>

              {/* Field Engineer Operational Assignment Details */}
              {newUser.role === 'Field Engineer' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Operational Workforce Auto-Provisioning</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    This engineer will be automatically registered in the active workforce and appear in 
                    <strong> Ticket Dispatch &amp; Manual Technician Selection</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Deployment Market
                      </label>
                      <select
                        value={newUser.market_id || 'mumbai'}
                        onChange={(e) => {
                          const m = e.target.value;
                          setNewUser({
                            ...newUser,
                            market_id: m,
                            region: m === 'kolkata' ? 'Salt Lake Sector V' : 'Bandra West'
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      >
                        <option value="mumbai">Mumbai MMR</option>
                        <option value="kolkata">Kolkata Metro</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Base Locality / Region
                      </label>
                      <select
                        value={newUser.region || (newUser.market_id === 'kolkata' ? 'Salt Lake Sector V' : 'Bandra West')}
                        onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                      >
                        {(MARKET_LOCALITIES[newUser.market_id || 'mumbai'] || MARKET_LOCALITIES.mumbai).map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={newUser.phone || ''}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="+91 98200 12345"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={newUser.is_active ? 'Active' : 'Disabled'}
                  onChange={(e) => setNewUser({ ...newUser, is_active: e.target.value === 'Active' })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 border-t border-slate-200 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {createUserSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT USER                                          */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>Edit User</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update identity details, assigned role, or account status.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              {editUserError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editUserError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email / User ID
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.full_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Role
                </label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                >
                  {assignableRoles.map((r) => {
                    if (!isSuperAdmin && (r.name === 'SUPER_ADMIN' || r.name === 'Admin' || (r.rank || 0) >= 80)) {
                      return null;
                    }
                    return (
                      <option key={r.id || r.name} value={r.name}>
                        {r.display_name || r.name} (Rank: {r.rank})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={editUserForm.is_active ? 'Active' : 'Disabled'}
                  onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.value === 'Active' })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 border-t border-slate-200 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {editUserSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW USER DETAILS                                  */}
      {/* ========================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">User Account Details</h3>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-slate-900 font-sans text-sm">{viewingUser.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email / User ID:</span>
                  <span className="font-bold text-slate-800">{viewingUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role:</span>
                  <span className="font-bold text-blue-700">{viewingUser.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={viewingUser.is_active !== false ? 'text-emerald-700 font-bold' : 'text-slate-500 font-bold'}>
                    {viewingUser.is_active !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Privilege Rank:</span>
                  <span className="font-bold text-slate-800">{viewingUser.rank || 10}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-600 font-bold uppercase tracking-wider text-[11px] block">
                  Effective Permissions ({viewingUser.permissions?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                  {viewingUser.permissions && viewingUser.permissions.length > 0 ? (
                    viewingUser.permissions.map((p) => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No permissions granted.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN USER ROLE                                   */}
      {/* ========================================================= */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Reassign User Role</h3>
                <p className="text-xs text-slate-500">
                  Target user: <strong className="text-slate-900">{assigningUser.email}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignUserRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Role
                </label>
                <select
                  value={selectedRoleForUser}
                  onChange={(e) => setSelectedRoleForUser(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  {assignableRoles.map((r) => {
                    if (!isSuperAdmin && (r.name === 'SUPER_ADMIN' || r.name === 'Admin' || (r.rank || 0) >= 80)) {
                      return null;
                    }
                    return (
                      <option key={r.id || r.name} value={r.name}>
                        {r.display_name || r.name} (Rank: {r.rank})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 font-mono">
                  Current role: {assigningUser.role}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {assignSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Assign Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE CUSTOM ROLE                                 */}
      {/* ========================================================= */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Create Custom Operational Role</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define a new operational role with selective module privileges.
                </p>
              </div>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Role Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NOC_SUPERVISOR"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 font-mono">
                    Uppercase identifier (e.g. REGIONAL_DISPATCHER)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regional Field Lead"
                    value={newRole.display_name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, display_name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Operational responsibilities and scope"
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Hierarchy Rank ({newRole.rank})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={isSuperAdmin ? 99 : 79}
                    value={newRole.rank}
                    onChange={(e) =>
                      setNewRole({ ...newRole, rank: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 font-mono">
                    {isSuperAdmin ? 'Range: 1 - 99' : 'Admin range: 1 - 79'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span>Select Granted Permissions ({newRole.permissions.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Check actions to grant
                  </span>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <div
                      key={cat}
                      className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{cat}</span>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => selectAllCategory(cat, false)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            All
                          </button>
                          <span>&bull;</span>
                          <button
                            type="button"
                            onClick={() => clearCategory(cat, false)}
                            className="text-slate-400 hover:underline cursor-pointer"
                          >
                            None
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const checked = newRole.permissions.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              onClick={() => toggleCreatePerm(p.code)}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                                checked
                                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <div className="space-y-0.5">
                                <div className="font-semibold">{p.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {p.code}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {createRoleSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ROLE PERMISSIONS                              */}
      {/* ========================================================= */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  <span>Configure Role: {editingRole.display_name || editingRole.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update display metadata and fine-tune granted module permissions.
                </p>
              </div>
              <button
                onClick={() => setEditingRole(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span>Granted Permissions ({editPermissions.length})</span>
                  </label>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <div
                      key={cat}
                      className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{cat}</span>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => selectAllCategory(cat, true)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            All
                          </button>
                          <span>&bull;</span>
                          <button
                            type="button"
                            onClick={() => clearCategory(cat, true)}
                            className="text-slate-400 hover:underline cursor-pointer"
                          >
                            None
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const checked = editPermissions.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              onClick={() => toggleEditPerm(p.code)}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                                checked
                                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <div className="space-y-0.5">
                                <div className="font-semibold">{p.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {p.code}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 -mx-5 -mb-5 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editRoleSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {editRoleSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE ROLE CONFIRMATION                           */}
      {/* ========================================================= */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirm Role Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete role{' '}
              <strong className="text-slate-900">
                {deletingRole.display_name || deletingRole.name}
              </strong>
              ? This action is permanent and will revoke access for users assigned to this role.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteRoleSubmitting}
                onClick={handleDeleteRole}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {deleteRoleSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Role</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
