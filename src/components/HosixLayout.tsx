import { FC } from 'react';
import { HosixRoutes } from '@hosix/components/layout/AppRouter';
import { AppProvider } from '@/contexts/AppContext';

/**
 * HosixLayout - Integration wrapper for HOSIX module
 * 
 * This component integrates the HOSIX routing system into RENAPROSA's main app.
 * It manages the context and shell layout for all HOSIX subsystems.
 * 
 * Architecture:
 * - Stays within RENAPROSA's single BrowserRouter
 * - Provides unified context (AppProvider for HOSIX, Auth, Hospital, etc.)
 * - Maintains clean separation of concerns
 * - Enables independent HOSIX evolution
 */
export const HosixLayout: FC = () => {
  return (
    <AppProvider>
      <div className="hosix-container">
        {/* HosixRoutes handles all HOSIX-specific routing and pages */}
        <HosixRoutes />
      </div>
    </AppProvider>
  );
};

export default HosixLayout;
