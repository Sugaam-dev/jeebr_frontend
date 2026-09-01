import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Public Marketing & Auth Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { UnauthorizedPage } from './pages/error/UnauthorizedPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

// Authenticated Application Dashboard Pages
import { ExecutiveCockpit } from './pages/cockpit/ExecutiveCockpit';
import { PilotBundle } from './pages/pilot-bundle/PilotBundle';
import { PredictiveAssurance } from './pages/assurance/PredictiveAssurance';
import { ChurnPrediction } from './pages/churn/ChurnPrediction';
import { RevenueAssurance } from './pages/revenue/RevenueAssurance';
import { OrchestrationQueue } from './pages/orchestration/OrchestrationQueue';
import { CustomerJourneys } from './pages/journeys/CustomerJourneys';
import { GovernanceAudit } from './pages/governance/GovernanceAudit';
import { CustomerSearch } from './pages/customer360/CustomerSearch';

// Protected Route Guard with optional RBAC checks
function ProtectedRoute({ children, allowedRoles }) {
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
    // Preserve requested path for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (user.role !== 'Admin' && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

// Redirect logged-in users away from /login and /signup
function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/cockpit" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Marketing Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Authentication Pages (Redirect to dashboard if already authenticated) */}
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

          {/* Protected Application Routes under AppLayout Shell */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/cockpit" element={<ExecutiveCockpit />} />
            <Route path="/pilot-bundle" element={<PilotBundle />} />
            <Route path="/assurance" element={<PredictiveAssurance />} />
            <Route path="/churn" element={<ChurnPrediction />} />
            <Route path="/revenue" element={<RevenueAssurance />} />
            <Route path="/orchestration" element={<OrchestrationQueue />} />
            <Route path="/journeys" element={<CustomerJourneys />} />
            <Route path="/governance" element={<GovernanceAudit />} />
            <Route path="/customer360" element={<CustomerSearch />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
