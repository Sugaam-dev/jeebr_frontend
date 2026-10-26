import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getHomeRouteForRole } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { GpsTrackingProvider } from './context/GpsTrackingContext';
import { ToastContainer } from './components/common/Toast';

// Layout Shells (Static for instantaneous shell mounting)
import { AppLayout } from './components/layout/AppLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { EngineerLayout } from './components/layout/EngineerLayout';

// Public Marketing & Auth Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { UnauthorizedPage } from './pages/error/UnauthorizedPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

// Helper to support both named and default exports in React.lazy
const lazyNamed = (importFn, name) => lazy(async () => {
  const m = await importFn();
  return { default: m[name] || m.default };
});

// Lazy Loaded Customer Portal Pages
const CustomerHome = lazyNamed(() => import('./pages/portal/customer/CustomerHome'), 'CustomerHome');
const CustomerTickets = lazyNamed(() => import('./pages/portal/customer/CustomerTickets'), 'CustomerTickets');
const CustomerTracking = lazyNamed(() => import('./pages/portal/customer/CustomerTracking'), 'CustomerTracking');
const CustomerBilling = lazyNamed(() => import('./pages/portal/customer/CustomerBilling'), 'CustomerBilling');

// Lazy Loaded Field Engineer Portal Pages
const EngineerJobList = lazyNamed(() => import('./pages/portal/engineer/EngineerJobList'), 'EngineerJobList');
const EngineerJobDetail = lazyNamed(() => import('./pages/portal/engineer/EngineerJobDetail'), 'EngineerJobDetail');

// Lazy Loaded Operations Dashboard Pages (Internal & Executive Roles)
const ExecutiveCockpit = lazyNamed(() => import('./pages/cockpit/ExecutiveCockpit'), 'ExecutiveCockpit');
const PilotBundle = lazyNamed(() => import('./pages/pilot-bundle/PilotBundle'), 'PilotBundle');
const PredictiveAssurance = lazyNamed(() => import('./pages/assurance/PredictiveAssurance'), 'PredictiveAssurance');
const ChurnPrediction = lazyNamed(() => import('./pages/churn/ChurnPrediction'), 'ChurnPrediction');
const RevenueAssurance = lazyNamed(() => import('./pages/revenue/RevenueAssurance'), 'RevenueAssurance');
const OrchestrationQueue = lazyNamed(() => import('./pages/orchestration/OrchestrationQueue'), 'OrchestrationQueue');
const CustomerJourneys = lazyNamed(() => import('./pages/journeys/CustomerJourneys'), 'CustomerJourneys');
const GovernanceAudit = lazyNamed(() => import('./pages/governance/GovernanceAudit'), 'GovernanceAudit');
const CustomerSearch = lazyNamed(() => import('./pages/customer360/CustomerSearch'), 'CustomerSearch');
const AutomaticTicketing = lazyNamed(() => import('./pages/ticketing/AutomaticTicketing'), 'AutomaticTicketing');
const FieldOperations = lazyNamed(() => import('./pages/field-operations/FieldOperations'), 'FieldOperations');
const RoleManagement = lazyNamed(() => import('./pages/admin/RoleManagement'), 'RoleManagement');
const NocTrackingMap = lazyNamed(() => import('./pages/noc/NocTrackingMap'), 'NocTrackingMap');
const FinanceManagement = lazyNamed(() => import('./pages/finance/FinanceManagement'), 'FinanceManagement');

// Minimal accessible loader for lazy chunks
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 gap-3">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-500 font-medium">Loading view...</span>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Marketing Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Authentication Pages */}
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
                <Route path="/portal/customer/billing" element={<CustomerBilling />} />
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
                <Route path="/dashboard/provisioning" element={<CustomerSearch defaultTab="provisioning" />} />
                <Route path="/dashboard/ticketing" element={<AutomaticTicketing />} />
                <Route path="/dashboard/field-operations" element={<FieldOperations />} />
                <Route path="/dashboard/roles" element={<RoleManagement />} />
                <Route path="/dashboard/users" element={<RoleManagement defaultTab="users" />} />
                {/* Phase 7A: NOC Live Engineer Tracking Map */}
                <Route path="/dashboard/noc-tracking" element={<NocTrackingMap />} />
                {/* SentinelOS Enterprise Finance & Billing Management */}
                <Route path="/dashboard/finance" element={<FinanceManagement />} />

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
                <Route path="/provisioning" element={<Navigate to="/dashboard/provisioning" replace />} />
                <Route path="/ticketing" element={<Navigate to="/dashboard/ticketing" replace />} />
                <Route path="/field-operations" element={<Navigate to="/dashboard/field-operations" replace />} />
                <Route path="/roles" element={<Navigate to="/dashboard/roles" replace />} />
                <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
                <Route path="/finance" element={<Navigate to="/dashboard/finance" replace />} />
              </Route>

              {/* Redirect legacy field-engineer routes to new isolated Engineer Portal */}
              <Route path="/field-engineer" element={<Navigate to="/portal/engineer/jobs" replace />} />
              <Route path="/field-engineer/jobs/:id" element={<Navigate to="/portal/engineer/jobs" replace />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </MarketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
