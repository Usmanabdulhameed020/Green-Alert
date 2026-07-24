import React from 'react';

const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

export default function LoadingSkeleton({ type = 'card', count = 3 }) {
  if (type === 'table') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b flex gap-6">
          {[...Array(5)].map((_, i) => (
            <Pulse key={i} className="h-4 w-24" />
          ))}
        </div>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="p-5 border-b border-slate-100 flex gap-6 last:border-0">
            {[...Array(5)].map((_, j) => (
              <Pulse key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <Pulse className="h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-1/3" />
              <Pulse className="h-3 w-1/2" />
            </div>
            <Pulse className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-5">
          <Pulse className="h-20 w-20 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Pulse className="h-6 w-1/3" />
            <Pulse className="h-4 w-1/4" />
          </div>
        </div>
        <Pulse className="h-64 w-full rounded-2xl" />
        <div className="space-y-3">
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-5/6" />
          <Pulse className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (type === 'report-card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="h-44 w-full bg-slate-100 relative">
              <Pulse className="h-full w-full rounded-none" />
              <div className="absolute top-4 left-4">
                <Pulse className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <Pulse className="h-5 w-3/4" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Pulse className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                    <Pulse className="h-3 w-1/2" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pulse className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                    <Pulse className="h-3 w-1/3" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                  <Pulse className="h-6 w-6 rounded-full flex-shrink-0" />
                  <Pulse className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Pulse className="h-5 w-16 rounded-full" />
                <Pulse className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="space-y-8 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm"
            >
              <div className="space-y-1">
                <Pulse className="h-3 w-20" />
                <Pulse className="h-8 w-12" />
              </div>
              <Pulse className="h-11 w-11 rounded-2xl flex-shrink-0" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="h-44 w-full bg-slate-100 relative">
                <Pulse className="h-full w-full rounded-none" />
                <div className="absolute top-4 left-4">
                  <Pulse className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <Pulse className="h-5 w-3/4" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Pulse className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                      <Pulse className="h-3 w-1/2" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Pulse className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                      <Pulse className="h-3 w-1/3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                    <Pulse className="h-6 w-6 rounded-full flex-shrink-0" />
                    <Pulse className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Pulse className="h-5 w-16 rounded-full" />
                  <Pulse className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: 'card'
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <Pulse className="h-4 w-1/4" />
          <Pulse className="h-8 w-1/2" />
          <Pulse className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}
