import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { Customer360Modal } from './components/Customer360Modal';

// Views
import { ExecutiveCockpit } from './views/ExecutiveCockpit';
import { PredictiveAssurance } from './views/PredictiveAssurance';
import { ChurnPrediction } from './views/ChurnPrediction';
import { CustomerJourneys } from './views/CustomerJourneys';
import { OrchestrationQueue } from './views/OrchestrationQueue';
import { RevenueAssurance } from './views/RevenueAssurance';
import { GovernanceAudit } from './views/GovernanceAudit';
import { CustomerSearch } from './views/CustomerSearch';
import { PilotBundle } from './views/PilotBundle';

const VALID_ROUTES = [
  'cockpit',
  'pilot-bundle',
  'assurance',
  'churn',
  'revenue',
  'orchestration',
  'journeys',
  'governance',
  'customer360'
];

function getInitialRoute() {
  try {
    const path = window.location.pathname.replace(/^\/+/, '').split('/')[0];
    if (VALID_ROUTES.includes(path)) return path;

    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (VALID_ROUTES.includes(hash)) return hash;

    const saved = localStorage.getItem('jeebr_active_tab');
    if (saved && VALID_ROUTES.includes(saved)) return saved;
  } catch {}
  return 'cockpit';
}

const MainLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(getInitialRoute);
  const [modalCustomerId, setModalCustomerId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jeebr-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Sync route on mount and listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      setActiveTab(route);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Ensure browser URL reflects current route
    const currentRoute = getInitialRoute();
    if (window.location.pathname !== `/${currentRoute}`) {
      window.history.replaceState({ tab: currentRoute }, '', `/${currentRoute}`);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleNavigate = (tab, replace = false) => {
    if (!VALID_ROUTES.includes(tab)) return;
    setActiveTab(tab);
    try {
      localStorage.setItem('jeebr_active_tab', tab);
    } catch {}

    const targetPath = `/${tab}`;
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('jeebr-sidebar-collapsed', String(collapsed));
    } catch {}
  };

  if (!user) {
    return <LoginModal />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'cockpit':
        return <ExecutiveCockpit onNavigate={handleNavigate} onOpen360={setModalCustomerId} />;
      case 'pilot-bundle':
        return <PilotBundle onOpen360={setModalCustomerId} onOpenGovernance={() => handleNavigate('governance')} />;
      case 'assurance':
        return <PredictiveAssurance onOpen360={setModalCustomerId} onOpenGovernance={() => handleNavigate('governance')} />;
      case 'churn':
        return <ChurnPrediction onOpen360={setModalCustomerId} onOpenGovernance={() => handleNavigate('governance')} />;
      case 'revenue':
        return <RevenueAssurance onOpen360={setModalCustomerId} onOpenGovernance={() => handleNavigate('governance')} />;
      case 'orchestration':
        return <OrchestrationQueue onOpen360={setModalCustomerId} onOpenGovernance={() => handleNavigate('governance')} />;
      case 'journeys':
        return <CustomerJourneys onOpen360={setModalCustomerId} onOpenGovernance={() => handleNavigate('governance')} />;
      case 'governance':
        return <GovernanceAudit onOpen360={setModalCustomerId} />;
      case 'customer360':
        return <CustomerSearch onOpen360={setModalCustomerId} />;
      default:
        return <ExecutiveCockpit onNavigate={handleNavigate} onOpen360={setModalCustomerId} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827] flex font-sans antialiased">
      {/* Dark Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />

      {/* Main Content Column with White Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar 
          onToggleSidebar={() => handleSidebarToggle(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          onOpen360Global={() => handleNavigate('customer360')}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-y-auto bg-[#F7F8FA]">
          {renderView()}
        </main>
      </div>

      {modalCustomerId && (
        <Customer360Modal
          customerId={modalCustomerId}
          onClose={() => setModalCustomerId(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

