import React, { useState } from 'react';
import { StaffAuthProvider } from '../../features/staff/StaffAuthContext.jsx';
import OperationsPortalShell from '../../features/staff/OperationsPortalShell.jsx';
import BarWorkspacePage from './BarWorkspacePage.jsx';
import CrmWorkspacePage from './CrmWorkspacePage.jsx';

export default function StaffOperationsPage() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <StaffAuthProvider>
      <OperationsPortalShell activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'crm' ? (
          <CrmWorkspacePage />
        ) : (
          <BarWorkspacePage activePortalTab={activeTab} />
        )}
      </OperationsPortalShell>
    </StaffAuthProvider>
  );
}
