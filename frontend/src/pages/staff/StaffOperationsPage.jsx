import React, { useState } from 'react';
import { StaffAuthProvider } from '../../features/staff/StaffAuthContext.jsx';
import OperationsPortalShell from '../../features/staff/OperationsPortalShell.jsx';
import BarWorkspacePage from './BarWorkspacePage.jsx';

export default function StaffOperationsPage() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <StaffAuthProvider>
      <OperationsPortalShell activeTab={activeTab} onTabChange={setActiveTab}>
        <BarWorkspacePage activePortalTab={activeTab} />
      </OperationsPortalShell>
    </StaffAuthProvider>
  );
}
