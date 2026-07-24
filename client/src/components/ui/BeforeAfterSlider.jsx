import React, { useState } from 'react';
import { ShieldCheck, Sparkles, SlidersHorizontal, Image as ImageIcon, Calendar } from 'lucide-react';

export default function BeforeAfterSlider({ beforeImage, afterImage, resolutionNotes, resolvedAt, agencyName }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'

  if (!beforeImage || !afterImage) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              Verified Resolution Proof
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              {agencyName ? `Resolved by ${agencyName}` : 'Official Agency Clean-up Verification'}
              {resolvedAt && ` • ${new Date(resolvedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'slider' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'side-by-side' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" /> Side-by-Side
          </button>
        </div>
      </div>

      {/* Interactive Slider View */}
      {viewMode === 'slider' ? (
        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden select-none shadow-inner border border-slate-200 group">
          {/* AFTER Image (Background) */}
          <img
            src={afterImage}
            alt="After resolution proof"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-emerald-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/20 shadow-md">
            ✨ After Clean-Up
          </div>

          {/* BEFORE Image (Clipped Foreground) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={beforeImage}
              alt="Before hazard report"
              className="absolute top-0 left-0 w-full h-full object-cover"
              style={{ width: '100%', maxWidth: 'none' }}
            />
            <div className="absolute top-3 left-3 bg-rose-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/20 shadow-md">
              🚨 Before Report
            </div>
          </div>

          {/* Vertical Slider Handle Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg flex items-center justify-center"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-xl border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-extrabold text-xs">
              ↔
            </div>
          </div>

          {/* Range Input overlay for easy drag/touch */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>
      ) : (
        /* Side by Side View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-rose-600 flex items-center gap-1">🚨 Before (Initial Hazard)</span>
            </div>
            <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
              <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-emerald-600 flex items-center gap-1">✨ After (Resolved Proof)</span>
            </div>
            <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
              <img src={afterImage} alt="After" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

      {/* Resolution Notes */}
      {resolutionNotes && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Agency Verification Log Notes
          </h4>
          <p className="text-xs text-emerald-800 font-medium leading-relaxed">
            "{resolutionNotes}"
          </p>
        </div>
      )}
    </div>
  );
}
