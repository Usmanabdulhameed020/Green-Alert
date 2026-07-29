import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';

export default function EmailStep({ onSubmit, isLoading, accent = 'emerald' }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const isAmber = accent === 'amber';

  const focusBorder = isAmber ? 'focus:border-amber-500' : 'focus:border-emerald-500';
  const btnClass = isAmber
    ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    onSubmit(email.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-sm text-slate-500 mb-5 font-medium">Enter your email to get started.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="name@example.com"
            autoFocus
            className={`w-full bg-slate-50 border border-slate-200 ${focusBorder} focus:bg-white outline-none text-sm rounded-lg pl-10 pr-4 py-2.5 text-slate-800 transition-all placeholder:text-slate-400`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2.5 ${btnClass} text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group`}
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Continue with Email
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
