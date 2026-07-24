import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';
import AlertModal from '../components/ui/AlertModal';
import Logo from '../assets/GreenAlert Logo.png';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

export default function VerifyEmail() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, message: '', isError: false });
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
    const nextEmpty = newCode.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const joined = code.join('');
    if (joined.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/auth/verify-email`, { code: joined });
      setSuccess(true);
      setModal({ open: true, message: 'Email verified successfully! You can now sign in.', isError: false });
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      setModal({ open: true, message: msg, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await axios.post(`${API_URL}/auth/send-verification`);
      setModal({ open: true, message: 'A new verification code has been sent to your email.', isError: false });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setModal({ open: true, message: msg, isError: true });
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-emerald-600 font-medium transition-colors">
          &larr; Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 text-center"
        >
          <img src={Logo} alt="GreenAlert" className="h-14 w-14 object-cover mx-auto mb-4" />
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Email Verified</h1>
          <p className="text-sm text-slate-400 mt-2 mb-6">Your account is ready. Sign in to get started.</p>
          <Link
            to="/login"
            className="inline-block w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all text-sm text-center"
          >
            Go to Login
          </Link>
        </motion.div>

        <AlertModal
          isOpen={modal.open}
          message={modal.message}
          onClose={() => setModal({ open: false, message: '', isError: false })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-emerald-600 font-medium transition-colors">
        &larr; Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <img src={Logo} alt="GreenAlert" className="h-14 w-14 object-cover mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Verify your email</h1>
          <p className="text-sm text-slate-400 mt-1">Enter the 6-digit code sent to your inbox</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none rounded-lg text-slate-800 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-slate-400 hover:text-emerald-600 font-semibold transition-colors disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
            Resend Code
          </button>
        </div>
      </motion.div>

      <AlertModal
        isOpen={modal.open}
        message={modal.message}
        onClose={() => setModal({ open: false, message: '', isError: false })}
      />
    </div>
  );
}
