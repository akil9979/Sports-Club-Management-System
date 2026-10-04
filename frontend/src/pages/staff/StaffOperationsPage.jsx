import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { StaffAuthProvider } from '../../features/staff/StaffAuthContext.jsx';
import OperationsPortalShell from '../../features/staff/OperationsPortalShell.jsx';
import BarWorkspacePage from './BarWorkspacePage.jsx';
import CrmWorkspacePage from './CrmWorkspacePage.jsx';
import FrontdeskVerificationWorkspace from '../../features/membership/FrontdeskVerificationWorkspace.jsx';
import ShopInventoryWorkspace from './ShopInventoryWorkspace.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function StaffOperationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { can, user, staffJob, isAdmin } = useAuth();

  // Determine authorized tabs for the current staff member
  const authorizedTabs = useMemo(() => {
    const tabs = [];
    if (can('members.view') || can('bookings.view')) tabs.push('frontdesk');
    if (can('bar_orders.view')) tabs.push('pos');
    if (can('bar_orders.update')) tabs.push('kds');
    if (can('bar_orders.view')) tabs.push('audit');
    if (can('products.view') || can('inventory.view')) tabs.push('shop');
    if (can('leads.view')) tabs.push('crm');
    return tabs;
  }, [can]);

  // Compute initial tab based on route, params, or first authorized tab
  const getRequestedTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam) return tabParam;
    if (location.pathname.includes('shop')) return 'shop';
    if (location.pathname.includes('verification') || location.pathname.includes('frontdesk')) {
      return 'frontdesk';
    }
    if (location.pathname.includes('bar')) {
      return 'pos';
    }
    if (location.pathname.includes('crm') || location.pathname.includes('leads')) {
      return 'crm';
    }
    // Default to the first authorized tab
    return authorizedTabs[0] || 'frontdesk';
  };

  const [activeTab, setActiveTab] = useState(getRequestedTab);

  // Sync state when URL params or location changes
  useEffect(() => {
    const requested = getRequestedTab();
    setActiveTab(requested);
  }, [searchParams, location.pathname, authorizedTabs]);

  // Check if current activeTab is permitted for this user
  const isTabPermitted = (tab) => {
    if (isAdmin) return true;
    if (tab === 'frontdesk' || tab === 'verification') {
      return can('members.view') || can('bookings.view');
    }
    if (tab === 'pos') {
      return can('bar_orders.view');
    }
    if (tab === 'kds') {
      return can('bar_orders.update');
    }
    if (tab === 'audit') {
      return can('bar_orders.view');
    }
    if (tab === 'shop') {
      return can('products.view') || can('inventory.view');
    }
    if (tab === 'crm') {
      return can('leads.view');
    }
    return false;
  };

  const hasAccess = isTabPermitted(activeTab);

  return (
    <StaffAuthProvider>
      <OperationsPortalShell activeTab={activeTab} onTabChange={setActiveTab}>
        {!hasAccess ? (
          <div className="py-16 flex items-center justify-center">
            <div className="bg-[#041c14] border border-rose-900/50 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="text-xl font-serif font-bold text-white">Module Access Restricted</h3>
              <p className="text-xs text-emerald-300/80 leading-relaxed">
                Your staff assignment (<span className="text-[#dfc99a] font-semibold">{staffJob?.name || 'Staff'}</span>) does not have permission to access the requested operational module.
              </p>
              {authorizedTabs.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab(authorizedTabs[0])}
                    className="px-4 py-2 text-xs font-bold btn-champagne rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    <span>Switch to Authorized Area ({authorizedTabs[0].toUpperCase()})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'shop' ? (
          <ShopInventoryWorkspace />
        ) : activeTab === 'frontdesk' || activeTab === 'verification' ? (
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
