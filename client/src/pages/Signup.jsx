import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, TreePine, Building2, MapPin } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import EmailStep from '../components/auth/EmailStep';
import SocialLogin from '../components/auth/SocialLogin';
import { useCitizen } from '../contexts/CitizenContext';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

const stats = [
  { icon: ShieldCheck, value: '500+', label: 'Reports Filed' },
  { icon: Building2, value: '50+', label: 'Partner Agencies' },
  { icon: TreePine, value: '10K+', label: 'Citizens' },
  { icon: MapPin, value: '15', label: 'States Covered' },
];

export default function Signup() {
  const { setUser, setToken } = useCitizen();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail);
    setStep('signup');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Server is not responding. Please make sure the backend is running.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('greenalert_user', JSON.stringify(data.data.user));
      localStorage.setItem('greenalert_token', data.data.token);
      setUser(data.data.user);
      setToken(data.data.token);

      navigate('/citizen-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      localStorage.setItem('greenalert_user', JSON.stringify(data.data.user));
      localStorage.setItem('greenalert_token', data.data.token);
      setUser(data.data.user);
      setToken(data.data.token);

      navigate('/citizen-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setError(null);
  };

  return (
    <AuthLayout
      title="Your first report is just a sign-up away."
      backTo="/"
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <EmailStep onSubmit={handleEmailSubmit} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="signup-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">{email}</span>
              </button>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Amina Bello"
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-sm rounded-lg pl-10 pr-4 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-sm rounded-lg pl-10 pr-11 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <SocialLogin onCredential={handleGoogleCredential} isLoading={isLoading} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <stat.icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-center">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          By joining, you agree to our{' '}
          <Link to="/terms" className="text-emerald-600 hover:text-emerald-500 font-semibold">Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-emerald-600 hover:text-emerald-500 font-semibold">Privacy Policy</Link>.
        </p>
      </div>

      <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-100 pt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
