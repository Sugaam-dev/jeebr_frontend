import React, { useState } from 'react';
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

const MainLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cockpit');
  const [modalCustomerId, setModalCustomerId] = useState(null);

  if (!user) {
    return <LoginModal />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'cockpit':
        return <ExecutiveCockpit onNavigate={setActiveTab} />;
      case 'assurance':
        return <PredictiveAssurance onOpen360={setModalCustomerId} onOpenGovernance={() => setActiveTab('governance')} />;
      case 'churn':
        return <ChurnPrediction onOpen360={setModalCustomerId} onOpenGovernance={() => setActiveTab('governance')} />;
      case 'revenue':
        return <RevenueAssurance onOpen360={setModalCustomerId} onOpenGovernance={() => setActiveTab('governance')} />;
      case 'orchestration':
        return <OrchestrationQueue onOpen360={setModalCustomerId} onOpenGovernance={() => setActiveTab('governance')} />;
      case 'journeys':
        return <CustomerJourneys onOpen360={setModalCustomerId} onOpenGovernance={() => setActiveTab('governance')} />;
      case 'governance':
        return <GovernanceAudit onOpen360={setModalCustomerId} />;
      case 'customer360':
        return <CustomerSearch onOpen360={setModalCustomerId} />;
      default:
        return <ExecutiveCockpit onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#14161C] text-[#EDEBE6] flex flex-col font-sans">
      <Navbar onOpen360Global={() => setActiveTab('customer360')} />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-3.5rem)] bg-[#14161C]">
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
