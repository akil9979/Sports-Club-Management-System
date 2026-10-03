import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { StaffAuthProvider } from '../../features/staff/StaffAuthContext.jsx';
import OperationsPortalShell from '../../features/staff/OperationsPortalShell.jsx';
import BarWorkspacePage from './BarWorkspacePage.jsx';
import CrmWorkspacePage from './CrmWorkspacePage.jsx';
import FrontdeskVerificationWorkspace from '../../features/membership/FrontdeskVerificationWorkspace.jsx';

export default function StaffOperationsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam) return tabParam;
    if (location.pathname.includes('verification') || location.pathname.includes('frontdesk')) {
      return 'frontdesk';
    }
    if (location.pathname.includes('bar')) {
      return 'pos';
    }
    return 'frontdesk';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.pathname.includes('verification') || location.pathname.includes('frontdesk')) {
      setActiveTab('frontdesk');
    }
  }, [searchParams, location.pathname]);

  return (
    <StaffAuthProvider>
      <OperationsPortalShell activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'frontdesk' || activeTab === 'verification' ? (
          <FrontdeskVerificationWorkspace />
        ) : activeTab === 'crm' ? (
          <CrmWorkspacePage />
        ) : (
          <BarWorkspacePage activePortalTab={activeTab} />
        )}
      </OperationsPortalShell>
    </StaffAuthProvider>
  );
}
