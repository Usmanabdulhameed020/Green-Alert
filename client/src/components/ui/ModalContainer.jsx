import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

const typeConfig = {
  error: {
    icon: AlertCircle,
    iconBg: 'bg-rose-100 text-rose-600 ring-rose-200',
    titleColor: 'text-slate-900',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 focus:ring-rose-500',
  },
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-rose-100 text-rose-600 ring-rose-200',
    titleColor: 'text-slate-900',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 focus:ring-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 text-amber-600 ring-amber-200',
    titleColor: 'text-slate-900',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 focus:ring-amber-500',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-600 ring-emerald-200',
    titleColor: 'text-slate-900',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 focus:ring-emerald-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 text-blue-600 ring-blue-200',
    titleColor: 'text-slate-900',
    confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 focus:ring-slate-900',
  },
};

export default function ModalContainer() {
  const { modalState, closeModal } = useModal();

  useEffect(() => {
    if (!modalState) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
      } else if (e.key === 'Enter') {
        closeModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState, closeModal]);

  if (!modalState) return null;

  const {
    title,
    message,
    type = 'info',
    mode = 'alert',
    confirmText = mode === 'confirm' ? 'Confirm' : 'OK',
    cancelText = 'Cancel',
  } = modalState;

  const currentType = typeConfig[type] || typeConfig.info;
  const IconComponent = currentType.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => closeModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button in top-right */}
          <button
            onClick={() => closeModal(false)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ring-4 shrink-0 ${currentType.iconBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <h3 className={`text-lg font-bold ${currentType.titleColor} tracking-tight`}>
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {mode === 'confirm' && (
              <button
                type="button"
                onClick={() => closeModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={() => closeModal(true)}
              className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentType.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
