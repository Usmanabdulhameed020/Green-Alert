import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export function useConfirm() {
  const [state, setState] = useState({ isOpen: false, message: '' });
  const resolveRef = useRef(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ isOpen: true, message });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setState({ isOpen: false, message: '' });
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setState({ isOpen: false, message: '' });
  }, []);

  const ConfirmDialog = () => (
    <ConfirmModal
      isOpen={state.isOpen}
      message={state.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog };
}

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 z-10 text-left"
      >
        <button onClick={onCancel} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-slate-900">Confirm</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}
