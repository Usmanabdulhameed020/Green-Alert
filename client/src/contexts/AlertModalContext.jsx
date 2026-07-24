import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

const AlertModalContext = createContext(null);

export function AlertModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'alert', // 'alert' | 'confirm'
    title: '',
    message: '',
    type: 'info', // 'info' | 'success' | 'error' | 'warning' | 'danger'
    confirmText: 'OK',
    cancelText: 'Cancel',
    confirmDanger: false,
  });

  const resolveRef = useRef(null);

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        isOpen: true,
        mode: 'alert',
        title: options.title || (options.type === 'error' ? 'Error' : options.type === 'success' ? 'Success' : 'Notice'),
        message: typeof message === 'string' ? message : String(message),
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK',
        cancelText: 'Cancel',
        confirmDanger: false,
      });
    });
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        isOpen: true,
        mode: 'confirm',
        title: options.title || 'Confirm Action',
        message: typeof message === 'string' ? message : String(message),
        type: options.type || (options.confirmDanger ? 'danger' : 'warning'),
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        confirmDanger: options.confirmDanger ?? true,
      });
    });
  }, []);

  const handleClose = useCallback((result = false) => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  // Intercept native window.alert and window.confirm globally
  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (msg) => {
      showAlert(String(msg || ''));
    };

    window.confirm = (msg) => {
      return showConfirm(String(msg || ''));
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, [showAlert, showConfirm]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalState.isOpen) return;
      if (e.key === 'Escape') {
        handleClose(false);
      } else if (e.key === 'Enter') {
        handleClose(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, handleClose]);

  const getIcon = (type, confirmDanger) => {
    if (confirmDanger || type === 'danger' || type === 'error') {
      return { Icon: XCircle, bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' };
    }
    if (type === 'warning') {
      return { Icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' };
    }
    if (type === 'success') {
      return { Icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' };
    }
    return { Icon: Info, bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' };
  };

  const { Icon, bg, text, border } = getIcon(modalState.type, modalState.confirmDanger);

  return (
    <AlertModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 z-10 text-left overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => handleClose(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header Icon + Content */}
              <div className="flex items-start gap-3.5">
                <div className={`h-11 w-11 rounded-2xl ${bg} border ${border} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className={`h-5 w-5 ${text}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{modalState.title}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed break-words">
                    {modalState.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 mt-6 pt-2">
                {modalState.mode === 'confirm' ? (
                  <>
                    <button
                      onClick={() => handleClose(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      {modalState.cancelText}
                    </button>
                    <button
                      onClick={() => handleClose(true)}
                      className={`px-5 py-2.5 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer ${
                        modalState.confirmDanger
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      }`}
                    >
                      {modalState.confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleClose(true)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm shadow-emerald-200 cursor-pointer text-center"
                  >
                    {modalState.confirmText}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertModalContext.Provider>
  );
}

export function useAlertModal() {
  const ctx = useContext(AlertModalContext);
  if (!ctx) {
    throw new Error('useAlertModal must be used within an AlertModalProvider');
  }
  return ctx;
}
