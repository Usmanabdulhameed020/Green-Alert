import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, Wrench } from 'lucide-react';
import SEO from '../components/SEO';
import AuthLayout from '../components/auth/AuthLayout';
import EmailStep from '../components/auth/EmailStep';
import SocialLogin from '../components/auth/SocialLogin';
import { useCitizen } from '../contexts/CitizenContext';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

export default function Login() {
  const { setUser, setToken, user } = useCitizen();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const navigate = useNavigate();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'agency' ? '/agency' : '/citizen-dashboard'} replace />;

  useEffect(() => {
    fetch(`${API_URL}/system/settings`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.maintenanceMode) setMaintenance(d.data); })
      .catch(() => {});
  }, []);

  const handleEmailSubmit = async (submittedEmail) => {
    setEmail(submittedEmail);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify email');
      }

      if (!data.exists) {
        setError('No account found with this email address. Please create an account first.');
        return;
      }

      setStep('password');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Server is not responding. Please make sure the backend is running.');
      }

      if (!response.ok) {
        if (data.awaitingVerification) {
          setError(data.message);
          return;
        }
        if (response.status === 429) {
          throw new Error('Too many sign-in attempts. Please wait a moment and try again.');
        }
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('greenalert_user', JSON.stringify(data.data.user));
      localStorage.setItem('greenalert_token', data.data.token);
      setUser(data.data.user);
      setToken(data.data.token);

      const role = data.data.user.role;
      if (role === 'citizen') navigate('/citizen-dashboard');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'agency') navigate('/agency');
      else navigate('/citizen-dashboard');
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

      const role = data.data.user.role;
      if (role === 'citizen') navigate('/citizen-dashboard');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'agency') navigate('/agency');
      else navigate('/citizen-dashboard');
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
      title="Welcome back"
      subtitle="Sign in to your account"
    >
      {maintenance && (
        <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-extrabold text-amber-700">Under Maintenance</span>
          </div>
          <p className="text-[11px] text-amber-600">{maintenance.maintenanceMessage || 'The platform is currently undergoing scheduled maintenance.'}</p>
          <p className="text-[10px] text-amber-500 mt-1">Only administrators can sign in during this time.</p>
        </div>
      )}

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
              key="password-step"
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

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Password</label>
                    <Link to="/forgot-password" className="text-[11px] text-emerald-600 font-semibold hover:text-emerald-500 transition-colors">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoFocus
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
                    'Sign In'
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

      <div className="mt-7 text-center text-sm text-slate-400 space-y-2.5">
        <p>
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors">
            Create one
          </Link>
        </p>
        <p className="text-xs">
          Represent an organization?{' '}
          <Link to="/register-org" className="text-amber-600 hover:text-amber-500 font-semibold transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
