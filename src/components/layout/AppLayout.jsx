import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Customer360Modal } from '../modals/Customer360Modal';

export const AppLayout = () => {
  const navigate = useNavigate();
  const [modalCustomerId, setModalCustomerId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sentinel-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('sentinel-sidebar-collapsed', String(collapsed));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#0F172A] flex font-sans antialiased overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area with Top Navbar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar 
          onToggleSidebar={() => handleSidebarToggle(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpen360Global={() => navigate('/customer360')}
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F5F8FF]">
          {/* Renders the active matched route page */}
          <Outlet context={{ onOpen360: setModalCustomerId }} />
        </main>
      </div>

      {/* Global Customer 360 Drawer/Modal */}
      {modalCustomerId && (
        <Customer360Modal
          customerId={modalCustomerId}
          onClose={() => setModalCustomerId(null)}
        />
      )}
    </div>
  );
};
