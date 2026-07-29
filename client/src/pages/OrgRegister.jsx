import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Building2, Upload } from 'lucide-react';
import axios from 'axios';
import AuthLayout from '../components/auth/AuthLayout';
import EmailStep from '../components/auth/EmailStep';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

const categories = [
  'Waste Management', 'Drainage & Flood Control', 'Oil & Chemical Spill Response',
  'Air Quality Management', 'Water Treatment', 'Parks & Forestry',
  'Roads & Infrastructure', 'Multi-Purpose',
];

export default function OrgRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    orgName: '', description: '', phone: '', address: '',
    website: '', category: '', licenseNumber: '', password: '',
  });
  const [file, setFile] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail);
    setStep('details');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('orgName', form.orgName);
      formData.append('description', form.description);
      formData.append('email', email);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('website', form.website);
      formData.append('category', form.category);
      formData.append('licenseNumber', form.licenseNumber);
      formData.append('password', form.password);
      if (file) formData.append('licenseDocument', file);
      await axios.post(`${API_URL}/auth/register-org`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setError(null);
  };

  if (success) {
    return (
      <div className="min-h-[100vh] bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-amber-600 font-medium transition-colors">
          &larr; Back to Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 text-center"
        >
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-slate-400">
            Your organization is awaiting admin verification. You'll be able to log in once approved.
          </p>
          <p className="text-xs text-slate-400 mt-4">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Register Organization"
      subtitle="Join as an environmental agency"
      backTo="/"
      accent="amber"
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <EmailStep onSubmit={handleEmailSubmit} isLoading={loading} accent="amber" />
          </motion.div>
        ) : (
          <motion.div
            key="details-step"
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Organization Name *</label>
                <input name="orgName" value={form.orgName} onChange={handleChange} required autoFocus
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} required rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all"
                  >
                    <option value="">Select</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address *</label>
                <input name="address" value={form.address} onChange={handleChange} required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
                  <input name="website" value={form.website} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">License Number</label>
                  <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">License Document <span className="text-slate-400 font-normal">(image or PDF)</span></label>
                <label className="flex items-center gap-2 w-full bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:bg-white rounded-lg px-3.5 py-2.5 cursor-pointer transition-all">
                  <Upload className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500 flex-1 truncate">{file ? file.name : 'Upload license document'}</span>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password *</label>
                <div className="relative">
                  <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange} required minLength={6}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 pr-11 py-2.5 text-slate-800 transition-all" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Register Organization'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="text-amber-600 hover:text-amber-500 font-semibold transition-colors">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
