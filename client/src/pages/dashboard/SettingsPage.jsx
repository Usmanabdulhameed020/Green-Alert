import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Sliders,
  AlertTriangle,
  Save,
  Trash2,
  Info,
  Loader2,
  Upload,
  Camera,
  KeyRound,
  Check,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useConfirm } from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import AlertModal from '../../components/ui/AlertModal';
import axios from 'axios';

// Simple Toggle Switch Component
const Toggle = ({ checked, onChange, label, desc }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div className="space-y-0.5">
      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">{label}</label>
      {desc && <p className="text-xs text-slate-400 font-semibold max-w-md">{desc}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
        checked ? 'bg-emerald-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const { user, settings, updateUser, updateSettings, deleteAccount, reports } = useCitizen();
  const { pushSupported, pushSubscribed, pushLoading, pushError, setPushError, enablePush, disablePush } = useNotifications();
  const { confirm, ConfirmDialog } = useConfirm();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Profile Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || settings?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || settings?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password Form states
  const [pwState, setPwState] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Notification states
  const [emailNotif, setEmailNotif] = useState(settings?.emailNotif ?? true);
  const [statusUpdates, setStatusUpdates] = useState(settings?.statusUpdates ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(settings?.weeklyDigest ?? true);

  // Privacy states
  const [publicReports, setPublicReports] = useState(settings?.publicReports ?? true);
  const [allowContact, setAllowContact] = useState(settings?.allowContact ?? true);

  // Preference states
  const [language, setLanguage] = useState(settings?.language || 'English');

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const url = res.data.data.urls?.[0] || res.data.data.url;
        setAvatar(url);
        await updateUser({ avatar: url });
        toastSuccess('Profile picture updated successfully');
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toastError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({ fullName, phone, avatar });
      await updateSettings({
        phone,
        emailNotif,
        statusUpdates,
        weeklyDigest,
        publicReports,
        allowContact,
        language,
      });
      toastSuccess('Account settings saved! Changes take effect across your dashboard.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toastError('There was a problem saving your settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);

    if (pwState.newPassword !== pwState.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwState.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }

    setPwSaving(true);
    try {
      await axios.patch('/api/v1/auth/me/password', {
        currentPassword: pwState.currentPassword,
        newPassword: pwState.newPassword,
      });
      setPwSaved(true);
      setPwState({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toastSuccess('Security password updated successfully!');
      setTimeout(() => setPwSaved(false), 4000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password. Verify your current password.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const check = await confirm('Are you absolutely sure you want to delete your GreenAlert account? All report logs and XP points will be permanently cleared.');
    if (!check) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      toastSuccess('Account deleted permanently');
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account:', err);
      toastError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      
      {/* Header Block */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Sliders className="h-7 w-7 text-emerald-600" />
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm font-semibold">Customize your profile preferences, security, notifications, and privacy options</p>
      </div>

      {/* Tabs Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Tabs Menu */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 gap-2 md:space-y-1.5 md:col-span-1 scrollbar-none whitespace-nowrap">
          {[
            { id: 'account', label: 'Profile Info', icon: User },
            { id: 'security', label: 'Security', icon: KeyRound },
            { id: 'notifications', label: 'Alert Toggles', icon: Bell },
            { id: 'privacy', label: 'Privacy Control', icon: Lock },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border-b-2 md:border-b-0 md:border-l-4 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <TabIcon className="h-4.5 w-4.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Active Tab Content */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 md:col-span-3 shadow-sm min-h-[420px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* Account Profile Tab */}
              {activeTab === 'account' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-3 mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-600" />
                    Profile & Preferences
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Login Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                      />
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        Login email address is fixed for account verification
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone number</label>
                      <input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      Profile Picture
                    </h4>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {avatar ? (
                            <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xl font-extrabold text-slate-500 select-none">
                              {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </span>
                          )}
                        </div>
                        <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-5 w-5 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm">
                          {uploadingAvatar ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</span>
                          ) : 'Change Photo'}
                          {!uploadingAvatar && (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          )}
                        </label>
                        {avatar && (
                          <button
                            type="button"
                            onClick={() => setAvatar('')}
                            className="block text-xs text-rose-600 hover:text-rose-500 font-semibold cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                        <p className="text-[10px] text-slate-400 font-semibold">PNG, JPG or WEBP. Max 10MB.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
                    {isSaving ? 'Saving...' : 'Save Account Changes'}
                  </button>
                </form>
              )}

              {/* Security & Password Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-3 mb-2 flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-emerald-600" />
                    Security & Password
                  </h3>

                  {pwError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold text-rose-600">
                      {pwError}
                    </div>
                  )}

                  {pwSaved && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                      <Check className="h-4 w-4" /> Password updated successfully!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Current Password</label>
                      <input
                        type="password"
                        required
                        value={pwState.currentPassword}
                        onChange={(e) => setPwState({ ...pwState, currentPassword: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={pwState.newPassword}
                        onChange={(e) => setPwState({ ...pwState, newPassword: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={pwState.confirmPassword}
                        onChange={(e) => setPwState({ ...pwState, confirmPassword: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {pwSaving ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <KeyRound className="h-4.5 w-4.5" />}
                    {pwSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-3 mb-2 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-emerald-600" />
                    Alert Notifications Settings
                  </h3>

                  <div className="divide-y divide-slate-100">
                    <Toggle
                      checked={emailNotif}
                      onChange={(val) => {
                        setEmailNotif(val);
                        updateSettings({ emailNotif: val });
                      }}
                      label="Email Notifications"
                      desc="Receive status workflow alert mails regarding submitted reports."
                    />
                    {pushSupported ? (
                      <Toggle
                        checked={pushSubscribed}
                        onChange={async (val) => {
                          setPushError('');
                          if (val) {
                            const ok = await enablePush();
                            if (!ok) {
                              toastError('Failed to enable push notifications. Check browser settings.');
                            }
                          } else {
                            await disablePush();
                          }
                        }}
                        label={pushLoading ? '⏳ Setting up...' : '🔔 Push Notifications (Free)'}
                        desc={pushLoading ? 'Please wait...' : 'Receive instant browser notifications even when you\'re not on GreenAlert. Works on desktop and mobile.'}
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-4 py-3 opacity-60">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">🔔 Push Notifications</label>
                          <p className="text-xs text-slate-400 font-semibold max-w-md">Not supported on this browser. Try Chrome, Edge, or Firefox.</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">Unavailable</span>
                      </div>
                    )}
                    {pushError && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mt-2">
                        <p className="text-xs font-semibold text-rose-600">{pushError}</p>
                        <button
                          onClick={() => setPushError('')}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-bold mt-1 underline cursor-pointer"
                        >Dismiss</button>
                      </div>
                    )}
                    <Toggle
                      checked={statusUpdates}
                      onChange={(val) => {
                        setStatusUpdates(val);
                        updateSettings({ statusUpdates: val });
                      }}
                      label="Report workflow updates"
                      desc="Notify me immediately when an agency comments or changes report status."
                    />
                    <Toggle
                      checked={weeklyDigest}
                      onChange={(val) => {
                        setWeeklyDigest(val);
                        updateSettings({ weeklyDigest: val });
                      }}
                      label="Weekly summary digests"
                      desc="Receive weekend environmental campaigns list in your local district area."
                    />
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-3 mb-2 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-emerald-600" />
                    Privacy & Controls
                  </h3>

                  <div className="divide-y divide-slate-100">
                    <Toggle
                      checked={publicReports}
                      onChange={(val) => {
                        setPublicReports(val);
                        updateSettings({ publicReports: val });
                      }}
                      label="Publish Reports Publicly"
                      desc="Display report coordinates and categories on the community explore page."
                    />
                    <Toggle
                      checked={allowContact}
                      onChange={(val) => {
                        setAllowContact(val);
                        updateSettings({ allowContact: val });
                      }}
                      label="Allow responder direct communication"
                      desc="Allow responding agencies to comment directly on details or request information."
                    />
                  </div>

                  <div className="pt-4 space-y-2.5">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Account Data logs export</span>
                    <button
                      onClick={() => {
                        const filtered = (reports || []).map((r) => ({
                          title: r.title,
                          category: r.category,
                          description: r.description,
                          location: r.location,
                          status: r.status,
                          priority: r.priority,
                          createdAt: r.createdAt,
                          updatedAt: r.updatedAt,
                        }));
                        const data = {
                          reports: filtered,
                          user: { name: user?.fullName, email: user?.email },
                          settings: { publicReports, allowContact, emailNotif, statusUpdates, defaultCategory },
                          downloadedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'greenalert-activity-data.json'; a.click();
                        URL.revokeObjectURL(url);
                        toastSuccess('Activity data exported successfully!');
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Download My Activity Data
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-100 bg-rose-50/20 p-5 rounded-2xl mt-8">
            <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-4.5 w-4.5" /> Danger Zone
            </h4>
            <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
              Once you delete your GreenAlert citizen account, all submitted environmental logs, saved bookmarks, and XP points will be permanently cleared.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-rose-600/10 active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Citizen Account
            </button>
          </div>

        </div>
      </div>
      <ConfirmDialog />
      <AlertModal isOpen={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
