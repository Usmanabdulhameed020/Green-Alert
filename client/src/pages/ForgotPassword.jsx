import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const requestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/request-password-change-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-password-change-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('Password changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Link to="/login" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-emerald-600 font-medium transition-colors">
        &larr; Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <img src="/GreenAlert Logo.png" alt="GreenAlert" className="h-14 w-14 object-cover mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">
            {step === 'email' ? 'Forgot password' : 'Reset password'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Check your email for the verification code'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            {message}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-sm rounded-lg pl-10 pr-4 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Verification code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400 text-center tracking-[0.5em] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-sm rounded-lg pl-10 pr-4 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-7 text-center text-sm text-slate-400">
          Remember your password?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
