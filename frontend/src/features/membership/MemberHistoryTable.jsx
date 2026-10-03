import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, FileText, Plus } from 'lucide-react';
import { getMemberMemberships } from './membershipApi.js';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getTierBadgeClass(tier) {
  const t = (tier || '').toUpperCase();
  if (t === 'GOLD') {
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
  }
  if (t === 'SILVER') {
    return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  }
  if (t === 'JUNIOR') {
    return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
  }
  return 'bg-slate-800 text-slate-400 border border-slate-700';
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        Active
      </span>
    );
  }
  if (s === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
      {status || 'Unknown'}
    </span>
  );
}

export default function MemberHistoryTable({ memberId, onRenewClick, refreshTrigger = 0, className = '' }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | expired

  const fetchHistory = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMemberMemberships(memberId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch membership history:', err);
      setError(err.message || 'Unable to load membership history from backend.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const filteredHistory = history.filter((item) => {
    if (filter === 'active') return item.status === 'active';
    if (filter === 'expired') return item.status === 'expired';
    return true;
  });

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Membership Subscription History</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
              {history.length} {history.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of membership tiers, billing terms, validity periods, and payments for member #{memberId}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pill Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({history.filter(h => h.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('expired')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'expired'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expired ({history.filter(h => h.status === 'expired').length})
            </button>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            title="Refresh History"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 space-y-4">
          <div className="flex items-center justify-center gap-3 text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
            <span>Retrieving membership subscription audit log...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-slate-800/40 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
            <AlertCircle className="w-6 h-6 shrink-0" />
          </div>
          <p className="text-sm font-medium text-rose-300 mb-1">Failed to load membership history</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchHistory}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          >
            Retry Request
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700/60">
            <FileText className="w-7 h-7 shrink-0" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">
            {filter === 'all' ? 'No Membership History Records' : `No ${filter} membership records found`}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {filter === 'all'
              ? 'This member does not have any active or past subscription terms registered yet.'
              : `There are currently no records matching the '${filter}' filter.`}
          </p>
          {onRenewClick && (
            <button
              type="button"
              onClick={onRenewClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Assign Membership Plan
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto mt-4 -mx-6 px-6">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Plan & Tier</th>
                <th className="py-3 px-3">Validity Period</th>
                <th className="py-3 px-3">Billing & Amount</th>
                <th className="py-3 px-3">Payment Ref</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredHistory.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Plan & Tier */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTierBadgeClass(item.tier)}`}>
                        {item.tier || 'STANDARD'}
                      </span>
                      <div>
                        <span className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {item.planName || 'Plan'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {item.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Validity Period */}
                  <td className="py-3.5 px-3">
                    <div className="text-slate-200 font-medium">
                      {formatDate(item.startDate)} → {formatDate(item.endDate)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.billingCycle === 'annual' ? '12 Months Term' : '1 Month Term'}
                    </div>
                  </td>

                  {/* Billing & Amount */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {item.billingCycle || 'monthly'}
                    </div>
                  </td>

                  {/* Payment Details */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.paymentMethod || 'N/A'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[110px]" title={item.referenceNumber}>
                        {item.referenceNumber || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 text-center">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Registered Timestamp */}
                  <td className="py-3.5 px-3 text-right text-slate-400 text-[11px]">
                    {item.createdAt ? formatDate(item.createdAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
