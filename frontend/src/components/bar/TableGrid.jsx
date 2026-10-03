import React, { useState, useMemo } from 'react';
import { Users, Wine, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TableGrid({
  tables = [],
  selectedTable = null,
  onSelectTable,
  loading = false,
  error = null,
  onRetry
}) {
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Extract sections
  const sections = useMemo(() => {
    const list = ['All'];
    tables.forEach((t) => {
      if (t.section && !list.includes(t.section)) {
        list.push(t.section);
      }
    });
    return list;
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchSection = sectionFilter === 'All' || table.section === sectionFilter;
      const matchStatus = statusFilter === 'All' || table.status === statusFilter;
      return matchSection && matchStatus;
    });
  }, [tables, sectionFilter, statusFilter]);

  // Status counters
  const counts = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter((t) => t.status === 'available').length,
      occupied: tables.filter((t) => t.status === 'occupied').length,
      open: tables.filter((t) => t.status === 'open').length
    };
  }, [tables]);

  if (loading) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 bg-slate-800 rounded animate-skeleton" />
          <div className="h-8 w-48 bg-slate-800 rounded animate-skeleton" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-slate-800/60 rounded-xl border border-slate-800/80 p-4 animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h4 className="text-base font-semibold text-rose-200">Failed to Load Tables</h4>
        <p className="text-sm text-rose-300/80 max-w-md mx-auto mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/90 p-5 shadow-xl">
      {/* Header & Status Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Wine className="w-5 h-5 text-emerald-400" />
              Bar & Lounge Tables
            </h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {tables.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a table to open a new tab or manage running orders
          </p>
        </div>

        {/* Quick status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === 'All'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              statusFilter === 'available'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-emerald-400/80 hover:bg-emerald-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Available ({counts.available})
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              statusFilter === 'occupied'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-amber-400/80 hover:bg-amber-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
            Occupied ({counts.occupied})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              statusFilter === 'open'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-sky-400/80 hover:bg-sky-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            Active Tab ({counts.open})
          </button>
        </div>
      </div>

      {/* Section Sub-Filter */}
      {sections.length > 2 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Zone:</span>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSectionFilter(sec)}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                sectionFilter === sec
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Tables */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Wine className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">No Tables Found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            No tables match the selected zone "{sectionFilter}" and status "{statusFilter}".
          </p>
          <button
            onClick={() => {
              setSectionFilter('All');
              setStatusFilter('All');
            }}
            className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            const isOccupied = table.status === 'occupied';
            const isOpenTab = table.status === 'open';
            const isAvailable = table.status === 'available';

            // Styling based on status
            let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900/60';
            let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            let statusText = 'Available';

            if (isSelected) {
              borderStyle = 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20';
            } else if (isOccupied) {
              borderStyle = 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10';
              badgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              statusText = 'Occupied';
            } else if (isOpenTab) {
              borderStyle = 'border-sky-500/30 hover:border-sky-500/60 bg-sky-950/10';
              badgeBg = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
              statusText = 'Active Tab';
            }

            return (
              <button
                key={table.id}
                onClick={() => onSelectTable(table)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between ${borderStyle}`}
              >
                <div>
                  {/* Top line: Table Number & Status Pill */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-bold text-white text-base font-mono">
                      #{table.number}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}
                    >
                      {statusText}
                    </span>
                  </div>

                  {/* Table Name & Section */}
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-emerald-300 transition-colors">
                    {table.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <span>{table.section}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Users className="w-3 h-3 text-slate-500" />
                      {table.capacity}p
                    </span>
                  </div>
                </div>

                {/* Bottom line: Occupied info or Available prompt */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {isAvailable ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready to Seat
                    </span>
                  ) : (
                    <>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 truncate">
                          {table.memberName || 'Table Tab'}
                        </span>
                        {table.membershipTier && (
                          <span className="text-[9px] font-semibold text-emerald-400">
                            {table.membershipTier} Tier
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white text-xs">
                          ₹{table.activeTabTotal || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Selected Indicator Checkmark */}
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg font-bold text-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
