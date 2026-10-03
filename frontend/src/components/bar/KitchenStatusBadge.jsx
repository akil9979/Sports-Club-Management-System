import React from 'react';
import { Clock, Flame, CheckCircle, Utensils, CheckCheck } from 'lucide-react';

const STATUS_MAP = {
  PENDING: { label: 'Pending Order', short: 'Pending', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock, pulse: true },
  PREPARING: { label: 'In Kitchen / Bar', short: 'Preparing', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: Flame, pulse: true },
  READY: { label: 'Ready for Service', short: 'Ready', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  SERVED: { label: 'Served to Table', short: 'Served', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: Utensils },
  SETTLED: { label: 'Tab Settled', short: 'Settled', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCheck }
};

const SIZES = {
  sm: { badge: 'text-[11px] px-2 py-0.5 gap-1', icon: 'w-3 h-3' },
  md: { badge: 'text-xs px-2.5 py-1 gap-1.5', icon: 'w-3.5 h-3.5' },
  lg: { badge: 'text-sm px-3.5 py-1.5 gap-2', icon: 'w-4 h-4' }
};

export default function KitchenStatusBadge({ status = 'PENDING', size = 'md', showIcon = true }) {
  const current = STATUS_MAP[status?.toUpperCase()] || STATUS_MAP.PENDING;
  const sizeStyle = SIZES[size] || SIZES.md;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${current.color} ${sizeStyle.badge}`}>
      {showIcon && <Icon className={`${sizeStyle.icon} ${current.pulse ? 'animate-pulse' : ''}`} />}
      <span>{size === 'sm' ? current.short : current.label}</span>
    </span>
  );
}
