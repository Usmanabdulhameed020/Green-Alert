import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Wrench } from 'lucide-react';
import SEO from '../components/SEO';
import { useCitizen } from '../contexts/CitizenContext';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

export default function Login() {
  const { setUser, setToken, user } = useCitizen();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'agency' ? '/agency' : '/citizen-dashboard'} replace />;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/system/settings`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.maintenanceMode) setMaintenance(d.data); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <SEO title="Sign In" />
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
          <img src="/GreenAlert Logo.png" alt="GreenAlert" className="h-14 w-14 object-cover mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
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
      </motion.div>
    </div>
  );
}
