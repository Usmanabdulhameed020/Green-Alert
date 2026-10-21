/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ModalContext = createContext(null);

// Global bridge reference so non-React / fallback code or window.alert can trigger modal
let globalModalHandler = null;

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);
  const resolveRef = useRef(null);

  const closeModal = useCallback((result = false) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setModalState(null);
  }, []);

  const openModal = useCallback((config) => {
    // If a modal is already open, resolve the previous one first
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState(config);
    });
  }, []);

  const alert = useCallback((options) => {
    if (typeof options === 'string') {
      options = { message: options };
    }
    const {
      title = options.type === 'error' ? 'Notice' : (options.type === 'warning' ? 'Warning' : 'Alert'),
      message = '',
      type = 'info',
      confirmText = 'Understood',
    } = options;

    return openModal({
      title,
      message,
      type,
      confirmText,
      mode: 'alert',
    });
  }, [openModal]);

  const confirm = useCallback((options) => {
    if (typeof options === 'string') {
      options = { message: options };
    }
    const {
      title = 'Are you sure?',
      message = '',
      type = options.isDestructive ? 'danger' : 'warning',
      confirmText = options.isDestructive ? 'Delete' : 'Confirm',
      cancelText = 'Cancel',
      isDestructive = false,
    } = options;

    return openModal({
      title,
      message,
      type: isDestructive ? 'danger' : type,
      confirmText,
      cancelText,
      isDestructive,
      mode: 'confirm',
    });
  }, [openModal]);

  const error = useCallback((message, title = 'Error Encountered') => {
    return alert({ title, message, type: 'error', confirmText: 'Close' });
  }, [alert]);

  const warning = useCallback((message, title = 'Warning') => {
    return alert({ title, message, type: 'warning', confirmText: 'Understood' });
  }, [alert]);

  const success = useCallback((message, title = 'Success') => {
    return alert({ title, message, type: 'success', confirmText: 'Continue' });
  }, [alert]);

  const info = useCallback((message, title = 'Information') => {
    return alert({ title, message, type: 'info', confirmText: 'OK' });
  }, [alert]);

  // Connect global bridge
  useEffect(() => {
    globalModalHandler = {
      alert,
      confirm,
      error,
      warning,
      success,
      info,
    };

    // Override native window.alert to automatically use our modal popup
    const originalAlert = window.alert;
    window.alert = (msg) => {
      // Intelligently classify error/warning messages
      const str = String(msg || '');
      const isErr = /fail|error|denied|invalid|cannot|unable/i.test(str);
      const isWarn = /warning|caution|limit|maximum|unsaved/i.test(str);
      const type = isErr ? 'error' : (isWarn ? 'warning' : 'info');
      const title = isErr ? 'Notice' : (isWarn ? 'Warning' : 'Notice');

      alert({ title, message: str, type });
    };

    return () => {
      globalModalHandler = null;
      window.alert = originalAlert;
    };
  }, [alert, confirm, error, warning, success, info]);

  return (
    <ModalContext.Provider
      value={{
        modalState,
        closeModal,
        alert,
        confirm,
        error,
        warning,
        success,
        info,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}

// Global invocation helpers for modules that may not be in React component tree
export const modalBridge = {
  alert: (opts) => globalModalHandler?.alert(opts),
  confirm: (opts) => globalModalHandler?.confirm(opts),
  error: (msg, title) => globalModalHandler?.error(msg, title),
  warning: (msg, title) => globalModalHandler?.warning(msg, title),
  success: (msg, title) => globalModalHandler?.success(msg, title),
  info: (msg, title) => globalModalHandler?.info(msg, title),
};
