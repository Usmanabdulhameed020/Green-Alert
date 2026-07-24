import React from 'react';

const statusConfig = {
  Submitted: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  'Under Review': {
    bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  Assigned: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  'In Progress': {
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Closed: {
    bg: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.Submitted;
  const sizeClasses = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${sizeClasses} transition-all`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
