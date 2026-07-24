import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('ga-cookie-consent');
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('ga-cookie-consent', 'accepted');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-700 font-semibold">🍪 We use cookies</p>
              <p className="text-xs text-slate-500 mt-1">We use essential cookies for authentication and security. By continuing, you agree to our <Link to="/privacy" className="text-emerald-600 hover:underline font-bold">Privacy Policy</Link> and <Link to="/terms" className="text-emerald-600 hover:underline font-bold">Terms of Service</Link>.</p>
            </div>
            <button
              onClick={accept}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
