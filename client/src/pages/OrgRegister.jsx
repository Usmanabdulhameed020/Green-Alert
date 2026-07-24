import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

const categories = [
  'Waste Management', 'Drainage & Flood Control', 'Oil & Chemical Spill Response',
  'Air Quality Management', 'Water Treatment', 'Parks & Forestry',
  'Roads & Infrastructure', 'Multi-Purpose',
];

export default function OrgRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orgName: '', description: '', email: '', phone: '', address: '',
    website: '', category: '', licenseNumber: '', password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register-org`, form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-amber-600 font-medium transition-colors">
          &larr; Back to Home
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 text-center"
        >
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-slate-400">Your organization is awaiting admin verification. You'll be able to log in once approved.</p>
          <p className="text-xs text-slate-400 mt-4">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-amber-600 font-medium transition-colors">
        &larr; Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <img src="/GreenAlert Logo.png" alt="GreenAlert" className="h-14 w-14 object-cover mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Register Organization</h1>
          <p className="text-sm text-slate-400 mt-1">Join as an environmental agency</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Organization Name *</label>
              <input name="orgName" value={form.orgName} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address *</label>
              <input name="address" value={form.address} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
              <input name="website" value={form.website} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all"
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">License Number</label>
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password *</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange} required minLength={6}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 pr-11 py-2.5 text-slate-800 transition-all placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >{loading ? 'Registering...' : 'Register Organization'}</button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-amber-600 hover:text-amber-500 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
