// @ts-nocheck
import React from 'react';
import { Menu, X, LogOut, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HospitalHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const HospitalHeader: React.FC<HospitalHeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/hosix/login');
  };

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Sistema de Gestión Hospitalaria
          </h1>
          <p className="text-xs text-muted-foreground">RENAPROSA — GNU Health</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.full_name || user?.email || 'Usuario'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default HospitalHeader;
