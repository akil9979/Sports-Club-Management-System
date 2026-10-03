import React from 'react';
import { Clock, Flame, CheckCircle, Utensils, CheckCheck } from 'lucide-react';

const STATUS_CONFIGS = {
  PENDING: {
    label: 'Pending Order',
    shortLabel: 'Pending',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Clock,
    pulse: true
  },
  PREPARING: {
    label: 'In Kitchen / Bar',
    shortLabel: 'Preparing',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    icon: Flame,
    pulse: true
  },
  READY: {
    label: 'Ready for Service',
    shortLabel: 'Ready',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle,
    pulse: false
  },
  SERVED: {
    label: 'Served to Table',
    shortLabel: 'Served',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    icon: Utensils,
    pulse: false
  },
  SETTLED: {
    label: 'Tab Settled',
    shortLabel: 'Settled',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    icon: CheckCheck,
    pulse: false
  }
};

export default function KitchenStatusBadge({ status, size = 'md', showIcon = true }) {
  const normalizedStatus = (status || 'PENDING').toUpperCase();
  const config = STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.PENDING;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showIcon && <IconComponent className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${config.pulse ? 'animate-pulse' : ''}`} />}
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
}
