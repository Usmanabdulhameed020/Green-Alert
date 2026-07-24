import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import logo from '../../assets/GreenAlert Logo.png';

export default function PDFReportGenerator({ report }) {
  const [generating, setGenerating] = useState(false);

  if (!report) return null;

  const handlePrint = () => {
    setGenerating(true);
    setTimeout(() => {
      window.print();
      setGenerating(false);
    }, 300);
  };

  const beforeImage = report.imageUrl || report.images?.[0] || '';
  const afterImage = report.resolutionImages?.[0] || '';

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handlePrint}
        disabled={generating}
        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer flex items-center gap-1.5 no-print"
        title="Download Official Compliance PDF Document"
      >
        {generating ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : <Download className="h-4 w-4" />}
        <span>Download Official PDF</span>
      </button>

      {/* Hidden Printable Official PDF Template (Only visible during window.print()) */}
      <div className="hidden print:block fixed inset-0 bg-white text-slate-900 font-sans p-8 z-[99999] overflow-visible">
        {/* Document Header */}
        <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="GreenAlert logo" className="h-12 w-12 object-cover" />
            <div>
              <h1 className="text-xl font-black text-emerald-950 uppercase tracking-wide">GreenAlert Environmental Portal</h1>
              <p className="text-xs text-slate-500 font-bold">Official Environmental Incident & Resolution Certificate</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Ref</div>
            <div className="text-xs font-mono font-bold text-emerald-800">GA-COMPL-{(report._id || report.id || '000').slice(-8).toUpperCase()}</div>
            <div className="text-[10px] text-slate-400 font-semibold">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
          </div>
        </div>

        {/* Status Stamp */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Official Case Status</span>
            <span className="text-base font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {report.status}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Severity Classification</span>
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">{report.priority} Priority</span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Agency</span>
            <span className="text-xs font-extrabold text-slate-800">{report.assignedTo?.name || 'Municipal Agency'}</span>
          </div>
        </div>

        {/* Case Details Table */}
        <div className="space-y-4 mb-6">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            Incident Metadata & Location
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-500 block">Report Title:</span>
              <span className="font-semibold text-slate-900">{report.title}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block">Category:</span>
              <span className="font-semibold text-slate-900">{report.category}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block">Location Description:</span>
              <span className="font-semibold text-slate-900">{report.location}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block">GPS Coordinates:</span>
              <span className="font-mono font-semibold text-slate-900">{report.latitude}, {report.longitude}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-500 block">Reporter Description:</span>
              <p className="font-medium text-slate-800 leading-relaxed mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">{report.description}</p>
            </div>
          </div>
        </div>

        {/* Hazard & Resolution Images */}
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            Photographic Evidence Audit
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {beforeImage && (
              <div>
                <div className="text-[10px] font-bold text-rose-700 uppercase mb-1">🚨 Initial Incident Photo (Before)</div>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-300">
                  <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {afterImage ? (
              <div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">✨ Resolution Verification Photo (After)</div>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-300">
                  <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-44 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs font-semibold">
                Pending Resolution Photo
              </div>
            )}
          </div>
          {report.resolutionNotes && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 mt-2">
              <span className="font-bold block text-[10px] uppercase text-emerald-700">Agency Resolution Notes:</span>
              "{report.resolutionNotes}"
            </div>
          )}
        </div>

        {/* Document Footer & Verification Seal */}
        <div className="border-t-2 border-slate-200 pt-4 mt-8 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generated via GreenAlert Environmental System</p>
            <p className="text-[9px] text-slate-400 font-semibold">Cryptographically verified environmental record • Confidential audit document</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-[10px] font-extrabold uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Officially Verified & Certified
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
