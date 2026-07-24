import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm font-semibold mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/15 transition-all text-sm"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
