import { motion } from 'framer-motion';
import { Info, X, AlertTriangle } from 'lucide-react';

export default function AlertModal({ isOpen, message, onClose, onConfirm, confirmText, confirmDanger }) {
  if (!isOpen) return null;

  const IconComponent = confirmDanger ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 z-10 text-left"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${confirmDanger ? 'bg-red-100' : 'bg-emerald-100'}`}>
            <IconComponent className={`h-5 w-5 ${confirmDanger ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-slate-900">{onConfirm ? 'Confirm' : 'Notice'}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  confirmDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirmText || 'Confirm'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              OK
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
