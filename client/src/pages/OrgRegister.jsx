import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Building2, Upload, Mail, Phone, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import axios from 'axios';
import AuthLayout from '../components/auth/AuthLayout';
import EmailStep from '../components/auth/EmailStep';

const BASE = import.meta.env.VITE_API_URL;
const API_URL = BASE ? `${BASE}/api/v1` : '/api/v1';

const categories = [
  'Waste Management',
  'Drainage & Flood Control',
  'Oil & Chemical Spill Response',
  'Air Quality Management',
  'Water Treatment',
  'Parks & Forestry',
  'Roads & Infrastructure',
  'Multi-Purpose',
];

const STEPS = [
  { id: 'email', title: 'Email', icon: Mail },
  { id: 'orgInfo', title: 'Organization', icon: Building2 },
  { id: 'contact', title: 'Contact', icon: MapPin },
  { id: 'security', title: 'Security', icon: ShieldCheck },
];

export default function OrgRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    orgName: '',
    description: '',
    phone: '',
    address: '',
    website: '',
    category: '',
    licenseNumber: '',
    password: '',
  });
  const [file, setFile] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getStepIndex = (stepId) => STEPS.findIndex((s) => s.id === stepId);
  const currentStepIndex = getStepIndex(step);

  // Step 1: Email check
  const handleEmailSubmit = async (submittedEmail) => {
    setEmail(submittedEmail);
    setError(null);
    setLoading(true);

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

      if (data.exists) {
        setError('An account with this email already exists. Please sign in instead.');
        return;
      }

      setStep('orgInfo');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 validation (Org Info)
  const handleOrgInfoSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!form.orgName.trim()) {
      setError('Please enter your organization name.');
      return;
    }
    if (!form.category) {
      setError('Please select a category.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please enter a brief description of your organization.');
      return;
    }
    setStep('contact');
  };

  // Step 3 validation (Contact Info)
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!form.phone.trim()) {
      setError('Please enter a phone number.');
      return;
    }
    if (!form.address.trim()) {
      setError('Please enter your address.');
      return;
    }
    setStep('security');
  };

  // Step 4 final submit (Security & Uploads)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

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
      {/* Progress Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 transition-all duration-300 -z-0"
            style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;
            return (
              <div key={s.id} className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-amber-500 text-white'
                      : isCurrent
                      ? 'bg-amber-600 text-white ring-4 ring-amber-100'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-[10px] font-semibold mt-1.5 ${isCurrent ? 'text-amber-700' : 'text-slate-400'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <EmailStep onSubmit={handleEmailSubmit} isLoading={loading} accent="amber" />
          </motion.div>
        )}

        {step === 'orgInfo' && (
          <motion.div
            key="info-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Step 2 of 4: Organization Info</span>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>

            <form onSubmit={handleOrgInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Organization Name *</label>
                <input
                  name="orgName"
                  value={form.orgName}
                  onChange={handleChange}
                  placeholder="e.g. Green Earth Initiative"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Primary Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief summary of your agency's mission and scope"
                  required
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Contact Details &rarr;
              </button>
            </form>
          </motion.div>
        )}

        {step === 'contact' && (
          <motion.div
            key="contact-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Step 3 of 4: Contact & Location</span>
              <button
                type="button"
                onClick={() => { setStep('orgInfo'); setError(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Official Phone Number *</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+234 800 123 4567"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Physical Office Address *</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. 12 Commerce Way, Ikeja, Lagos"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Official Website <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.org"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Verification &rarr;
              </button>
            </form>
          </motion.div>
        )}

        {step === 'security' && (
          <motion.div
            key="security-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Step 4 of 4: Verification & Password</span>
              <button
                type="button"
                onClick={() => { setStep('contact'); setError(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  License / CAC Registration Number <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  placeholder="e.g. RC-123456"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Upload License Document <span className="text-slate-400 font-normal">(Image or PDF, optional)</span>
                </label>
                <label className="flex items-center gap-2 w-full bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:bg-white rounded-lg px-3.5 py-2.5 cursor-pointer transition-all">
                  <Upload className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500 flex-1 truncate">{file ? file.name : 'Choose document file'}</span>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account Password *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white outline-none text-sm rounded-lg px-3.5 pr-11 py-2.5 text-slate-800 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Complete Organization Registration'
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
