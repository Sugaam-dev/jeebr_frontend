import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getHomeRouteForRole } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { GpsTrackingProvider } from './context/GpsTrackingContext';
import { ToastContainer } from './components/common/Toast';

// Layout Shells
import { AppLayout } from './components/layout/AppLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { EngineerLayout } from './components/layout/EngineerLayout';

// Public Marketing & Auth Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { UnauthorizedPage } from './pages/error/UnauthorizedPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

// Customer Portal Pages
import { CustomerHome } from './pages/portal/customer/CustomerHome';
import { CustomerTickets } from './pages/portal/customer/CustomerTickets';
import { CustomerTracking } from './pages/portal/customer/CustomerTracking';

// Field Engineer Portal Pages
import { EngineerJobList } from './pages/portal/engineer/EngineerJobList';
import { EngineerJobDetail } from './pages/portal/engineer/EngineerJobDetail';

// Operations Dashboard Pages (Internal & Executive Roles)
import { ExecutiveCockpit } from './pages/cockpit/ExecutiveCockpit';
import { PilotBundle } from './pages/pilot-bundle/PilotBundle';
import { PredictiveAssurance } from './pages/assurance/PredictiveAssurance';
import { ChurnPrediction } from './pages/churn/ChurnPrediction';
import { RevenueAssurance } from './pages/revenue/RevenueAssurance';
import { OrchestrationQueue } from './pages/orchestration/OrchestrationQueue';
import { CustomerJourneys } from './pages/journeys/CustomerJourneys';
import { GovernanceAudit } from './pages/governance/GovernanceAudit';
import { CustomerSearch } from './pages/customer360/CustomerSearch';
import { AutomaticTicketing } from './pages/ticketing/AutomaticTicketing';
import { FieldOperations } from './pages/field-operations/FieldOperations';
import { RoleManagement } from './pages/admin/RoleManagement';
import { NocTrackingMap } from './pages/noc/NocTrackingMap';

// Dynamic Role-Aware Portal Guard
export function PortalRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FF]">
        <div className="w-8 h-8 border-3 border-[#2463EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super Admin & System Administrator have cross-portal access for auditing
  if (user.role === 'SUPER_ADMIN' || user.role === 'Admin') {
    return children;
  }

  // If user role does NOT have access, seamlessly redirect to THEIR designated portal home
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  return children;
}

// Redirect authenticated users away from public auth pages to their designated portal
export function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MarketProvider>
          <ToastContainer />
          <Routes>
            {/* Public Marketing Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Authentication Pages (Redirect to user's portal if already authenticated) */}
            <Route path="/login" element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            } />
            
            <Route path="/signup" element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            } />

            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* === 1. CUSTOMER SELF-SERVICE PORTAL (Isolated Layout, Role-Gated) === */}
            <Route element={
              <PortalRoute allowedRoles={['Customer']}>
                <CustomerLayout />
              </PortalRoute>
            }>
              <Route path="/portal/customer" element={<Navigate to="/portal/customer/home" replace />} />
              <Route path="/portal/customer/home" element={<CustomerHome />} />
              <Route path="/portal/customer/tickets" element={<CustomerTickets />} />
              <Route path="/portal/customer/track/:id" element={<CustomerTracking />} />
              <Route path="/portal/customer/tracking" element={<CustomerTracking />} />
            </Route>

            {/* === 2. FIELD ENGINEER MOBILE PORTAL (Isolated Mobile Layout, Role-Gated) === */}
            <Route element={
              <PortalRoute allowedRoles={['Field Engineer']}>
                <GpsTrackingProvider>
                  <EngineerLayout />
                </GpsTrackingProvider>
              </PortalRoute>
            }>
              <Route path="/portal/engineer" element={<Navigate to="/portal/engineer/jobs" replace />} />
              <Route path="/portal/engineer/jobs" element={<EngineerJobList />} />
              <Route path="/portal/engineer/job/:id" element={<EngineerJobDetail />} />
            </Route>

            {/* === 3. OPERATIONS & AI GOVERNANCE DASHBOARD (AppLayout, Role-Gated) === */}
            <Route element={
              <PortalRoute allowedRoles={['Admin', 'NOC', 'Care', 'Revenue', 'Executive', 'Viewer']}>
                <AppLayout />
              </PortalRoute>
            }>
              <Route path="/dashboard" element={<Navigate to="/dashboard/cockpit" replace />} />
              <Route path="/dashboard/cockpit" element={<ExecutiveCockpit />} />
              <Route path="/dashboard/pilot-bundle" element={<PilotBundle />} />
              <Route path="/dashboard/assurance" element={<PredictiveAssurance />} />
              <Route path="/dashboard/churn" element={<ChurnPrediction />} />
              <Route path="/dashboard/revenue" element={<RevenueAssurance />} />
              <Route path="/dashboard/orchestration" element={<OrchestrationQueue />} />
              <Route path="/dashboard/journeys" element={<CustomerJourneys />} />
              <Route path="/dashboard/governance" element={<GovernanceAudit />} />
              <Route path="/dashboard/customer360" element={<CustomerSearch />} />
              <Route path="/dashboard/customers" element={<CustomerSearch />} />
              <Route path="/dashboard/ticketing" element={<AutomaticTicketing />} />
              <Route path="/dashboard/field-operations" element={<FieldOperations />} />
              <Route path="/dashboard/roles" element={<RoleManagement />} />
              <Route path="/dashboard/users" element={<RoleManagement defaultTab="users" />} />
              {/* Phase 7A: NOC Live Engineer Tracking Map */}
              <Route path="/dashboard/noc-tracking" element={<NocTrackingMap />} />

              {/* Seamless Backwards-Compatibility Aliases */}
              <Route path="/cockpit" element={<Navigate to="/dashboard/cockpit" replace />} />
              <Route path="/pilot-bundle" element={<Navigate to="/dashboard/pilot-bundle" replace />} />
              <Route path="/assurance" element={<Navigate to="/dashboard/assurance" replace />} />
              <Route path="/churn" element={<Navigate to="/dashboard/churn" replace />} />
              <Route path="/revenue" element={<Navigate to="/dashboard/revenue" replace />} />
              <Route path="/orchestration" element={<Navigate to="/dashboard/orchestration" replace />} />
              <Route path="/journeys" element={<Navigate to="/dashboard/journeys" replace />} />
              <Route path="/governance" element={<Navigate to="/dashboard/governance" replace />} />
              <Route path="/customer360" element={<Navigate to="/dashboard/customer360" replace />} />
              <Route path="/customers" element={<Navigate to="/dashboard/customer360" replace />} />
              <Route path="/ticketing" element={<Navigate to="/dashboard/ticketing" replace />} />
              <Route path="/field-operations" element={<Navigate to="/dashboard/field-operations" replace />} />
              <Route path="/roles" element={<Navigate to="/dashboard/roles" replace />} />
              <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
            </Route>

            {/* Redirect legacy field-engineer routes to new isolated Engineer Portal */}
            <Route path="/field-engineer" element={<Navigate to="/portal/engineer/jobs" replace />} />
            <Route path="/field-engineer/jobs/:id" element={<Navigate to="/portal/engineer/jobs" replace />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MarketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
