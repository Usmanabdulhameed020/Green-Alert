import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Trophy,
  Calendar,
  CheckCircle,
  FileText,
  Lock,
  Mail,
  X,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import StatusBadge from '../../components/ui/StatusBadge';
import axios from 'axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, reports, points } = useCitizen();

  // Password Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [step, setStep] = useState(1); // 1 = request, 2 = verify & change
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingChange, setLoadingChange] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const totalReportsCount = reports.length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'Resolved').length;
  const currentLevel = Math.floor(points / 100) + 1;

  const getInitials = () => {
    if (!user?.fullName) return 'C';
    return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRequestCode = async () => {
    setLoadingCode(true);
    setModalError('');
    setModalSuccess('');
    try {
      const res = await axios.post(
        '/api/v1/auth/request-password-change-code',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setStep(2);
        setModalSuccess('Verification code sent to your email.');
      } else {
        setModalError(res.data?.message || 'Failed to send verification code.');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to request verification code.');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleVerifyAndChange = async (e) => {
    e.preventDefault();
    if (!verificationCode || !newPassword) {
      setModalError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }

    setLoadingChange(true);
    setModalError('');
    setModalSuccess('');
    try {
      const res = await axios.post(
        '/api/v1/auth/verify-password-change-code',
        { code: verificationCode, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setModalSuccess('Password changed successfully!');
        setTimeout(() => {
          setShowPasswordModal(false);
          // Reset modal states
          setStep(1);
          setVerificationCode('');
          setNewPassword('');
          setModalSuccess('');
        }, 2000);
      } else {
        setModalError(res.data?.message || 'Failed to change password.');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoadingChange(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12 max-w-4xl mx-auto relative font-sans"
    >
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar / Logo Display */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover shadow-md border-4 border-white select-none"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-md border-4 border-white select-none">
              {getInitials()}
            </div>
          )}
          
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
                {user?.fullName || 'Citizen User'}
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                {user?.role || 'Citizen'}
              </span>
            </div>
            
            <p className="text-slate-500 text-xs sm:text-sm font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="h-4 w-4 text-slate-400" />
              {user?.email || 'name@organization.com'}
            </p>

            <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
              <Calendar className="h-4 w-4 text-slate-400" />
              Member since July 2026
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/citizen-dashboard/settings')}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Edit Profile
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: 'Incident Reports', value: totalReportsCount, icon: FileText, color: 'text-slate-500 bg-slate-50 border-slate-200' },
          { label: 'Resolved Cases', value: resolvedReportsCount, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
          { label: 'XP Points Earned', value: points, icon: Trophy, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
          { label: 'Reporter Level', value: currentLevel, icon: Shield, color: 'text-blue-500 bg-blue-50 border-blue-200' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
              </div>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 2 columns - Report History */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">My Reports History</h3>
              <span className="text-xs text-slate-400 font-semibold">Showing last 5</span>
            </div>

            <div className="divide-y divide-slate-100 flex-1">
              {reports.length === 0 ? (
                <p className="text-center py-12 text-xs text-slate-400 font-semibold">
                  You haven't logged any reports yet.
                </p>
              ) : (
                reports.slice(0, 5).map((report) => (
                  <div key={report.id || report._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{report.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate font-semibold">{report.location}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={report.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 column - Account & Security */}
        <div className="space-y-6">
          {/* Account Security */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="h-4.5 w-4.5 text-emerald-600" />
              Security Check
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Security Email</span>
                <p className="text-xs font-semibold text-slate-700 truncate">{user?.email || 'name@organization.com'}</p>
              </div>

              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Login Password</span>
                <p className="text-xs font-semibold text-slate-700">••••••••</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(true);
                setStep(1);
                setModalError('');
                setModalSuccess('');
              }}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Change password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 relative overflow-hidden"
            >
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="mb-5 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Security verification</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Change account password securely</p>
                </div>
              </div>

              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl">
                  {modalSuccess}
                </div>
              )}

              {step === 1 ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    To update your password, we need to send a 6-digit confirmation code to your registered email: <strong>{user?.email}</strong>.
                  </p>
                  <button
                    onClick={handleRequestCode}
                    disabled={loadingCode}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md"
                  >
                    {loadingCode && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loadingCode ? 'Requesting Code...' : 'Send Verification Code'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyAndChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Verification Code</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 px-3.5 text-xs font-semibold outline-none tracking-widest text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 px-3.5 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loadingChange}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md"
                    >
                      {loadingChange && <Loader2 className="h-4 w-4 animate-spin" />}
                      Verify & Change
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
