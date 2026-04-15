// @ts-nocheck
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import HospitalSidebar from './HospitalSidebar';
import HospitalHeader from './HospitalHeader';

const HospitalLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <HospitalSidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HospitalHeader 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default HospitalLayout;
