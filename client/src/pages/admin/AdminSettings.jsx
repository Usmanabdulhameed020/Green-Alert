import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Save,
  Loader2,
  Upload,
  ShieldAlert,
  Megaphone,
  Check,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import AlertModal from '../../components/ui/AlertModal';
import axios from 'axios';

// Reusable Toggle Switch
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

// Tab Sidebar Button
const TabBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
      active
        ? 'bg-emerald-50 text-emerald-700 shadow-sm border-b-2 md:border-b-0 md:border-l-4 border-emerald-600'
        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
    }`}
  >
    <Icon className="h-4.5 w-4.5" />
    {label}
  </button>
);

export default function AdminSettings() {
  const { user, updateUser } = useCitizen();
  const { pushSupported, pushSubscribed, pushLoading, pushError, setPushError, enablePush, disablePush } = useNotifications();
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System & Maintenance', icon: ShieldAlert },
  ];

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification state
  const [emailNotif, setEmailNotif] = useState(user?.settings?.emailNotif ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.settings?.weeklyDigest ?? true);
  const [newUserAlerts, setNewUserAlerts] = useState(user?.settings?.newUserAlerts ?? true);
  const [newOrgAlerts, setNewOrgAlerts] = useState(user?.settings?.newOrgAlerts ?? true);
  const [reportAssignedNotif, setReportAssignedNotif] = useState(user?.settings?.reportAssignedNotif ?? true);

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System is currently under scheduled maintenance.');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('Welcome to GreenAlert Environmental Portal');
  const [isSavingSystem, setIsSavingSystem] = useState(false);

  const [alertMsg, setAlertMsg] = useState('');

  // Fetch System Settings on Mount
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const { data } = await axios.get('/api/v1/system/settings');
        if (data?.success && data.data) {
          setMaintenanceMode(data.data.maintenanceMode || false);
          if (data.data.maintenanceMessage) setMaintenanceMessage(data.data.maintenanceMessage);
          setAnnouncementEnabled(data.data.announcementEnabled || false);
          if (data.data.announcementMessage) setAnnouncementMessage(data.data.announcementMessage);
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      }
    };
    fetchSystemSettings();
  }, []);

  // Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateUser({ fullName, phone, avatar });
      setAlertMsg('Admin profile updated successfully!');
      toastSuccess('Profile updated!');
    } catch (err) {
      setAlertMsg('Failed to update profile. Please try again.');
      toastError('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const res = await axios.post('/api/v1/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const url = res.data.data.urls?.[0] || res.data.data.url;
        setAvatar(url);
        await updateUser({ avatar: url });
        setAlertMsg('Profile picture updated!');
        toastSuccess('Avatar updated!');
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAlertMsg('Failed to upload avatar. Please try again.');
      toastError('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveNotifications = async () => {
    const prefs = { emailNotif, weeklyDigest, newUserAlerts, newOrgAlerts, reportAssignedNotif };
    localStorage.setItem('greenalert_admin_notif_prefs', JSON.stringify(prefs));
    await updateUser({ settings: prefs });
    setAlertMsg('Admin notification preferences saved!');
    toastSuccess('Notification preferences saved!');
  };

  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    setIsSavingSystem(true);
    try {
      await axios.patch('/api/v1/system/maintenance', {
        maintenanceMode,
        maintenanceMessage,
      });
      await axios.patch('/api/v1/system/announcement', {
        announcementEnabled,
        announcementMessage,
      });
      setAlertMsg('System settings and maintenance configuration updated!');
      toastSuccess('System configuration saved!');
    } catch (err) {
      console.error('Failed to update system settings:', err);
      setAlertMsg('Failed to update system settings. Check permissions.');
      toastError('Failed to save system settings.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Portal Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your admin profile, system notification rules, and platform maintenance status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left - Tabs */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 gap-2 md:space-y-1.5 md:col-span-1 scrollbar-none whitespace-nowrap">
          {tabs.map((tab) => (
            <TabBtn key={tab.id} icon={tab.icon} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>

        {/* Right - Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 md:col-span-3 shadow-sm min-h-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-600" /> Admin Profile
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-400 font-semibold">Email address is read-only.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone number</label>
                      <input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Role</label>
                      <input
                        type="text"
                        value="Super Administrator"
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-emerald-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-emerald-600" /> Profile Picture
                    </h4>
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {avatar ? (
                          <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm">
                          {uploadingAvatar ? 'Uploading...' : 'Choose Photo'}
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                        </label>
                        {avatar && (
                          <button type="button" onClick={() => setAvatar('')} className="block text-xs text-rose-600 hover:text-rose-500 font-semibold cursor-pointer">
                            Remove
                          </button>
                        )}
                        <p className="text-[10px] text-slate-400 font-semibold">PNG, JPG or WEBP. Max 10MB.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
                    {isSavingProfile ? 'Saving...' : 'Save Admin Profile'}
                  </button>
                </form>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-emerald-600" /> Notification Preferences
                  </h3>
                  <div className="divide-y divide-slate-100">
                    <Toggle checked={emailNotif} onChange={setEmailNotif} label="Email Notifications" desc="Receive email updates for critical platform alerts." />
                    {pushSupported ? (
                      <div>
                        <Toggle
                          checked={pushSubscribed}
                          onChange={async (val) => {
                            setPushError('');
                            if (val) {
                              const ok = await enablePush();
                              if (!ok) toastError('Failed to enable push notifications. Check browser settings.');
                            } else {
                              await disablePush();
                            }
                          }}
                          label={pushLoading ? '⏳ Setting up...' : '🔔 Push Notifications (Free)'}
                          desc={pushLoading ? 'Please wait...' : 'Receive instant browser push notifications for emergency reports and system changes.'}
                        />
                        {pushError && (
                          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 mt-2">
                            <p className="text-[11px] font-semibold text-rose-600">{pushError}</p>
                            <button onClick={() => setPushError('')} className="text-[10px] text-rose-500 hover:text-rose-700 font-bold mt-1 underline cursor-pointer">
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4 py-3 opacity-60">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">🔔 Push Notifications</label>
                          <p className="text-xs text-slate-400 font-semibold max-w-md">Not supported on this browser. Try Chrome, Edge, or Firefox.</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">Unavailable</span>
                      </div>
                    )}
                    <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} label="Weekly Platform Digest" desc="Get a weekly summary of reports, users, and agency metrics." />
                    <Toggle checked={newUserAlerts} onChange={setNewUserAlerts} label="New Citizen Registrations" desc="Alert me when a new citizen registers on GreenAlert." />
                    <Toggle checked={newOrgAlerts} onChange={setNewOrgAlerts} label="New Organization Signups" desc="Alert me when an agency registers and awaits approval." />
                    <Toggle checked={reportAssignedNotif} onChange={setReportAssignedNotif} label="Report Assignment Alerts" desc="Notify me when reports are assigned or unassigned." />
                  </div>
                  <button
                    onClick={handleSaveNotifications}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="h-4.5 w-4.5" /> Save Preferences
                  </button>
                </div>
              )}

              {/* SYSTEM CONTROLS TAB */}
              {activeTab === 'system' && (
                <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600" /> Platform Maintenance & System Controls
                  </h3>

                  <div className="space-y-6">
                    {/* Maintenance Toggle */}
                    <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3">
                      <Toggle
                        checked={maintenanceMode}
                        onChange={setMaintenanceMode}
                        label="System Maintenance Mode"
                        desc="When enabled, non-admin users will be presented with a maintenance screen."
                      />
                      {maintenanceMode && (
                        <div className="space-y-1.5 pt-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Maintenance Screen Message</label>
                          <textarea
                            rows={2}
                            value={maintenanceMessage}
                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                        </div>
                      )}
                    </div>

                    {/* Announcement Banner Toggle */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <Megaphone className="h-4 w-4 text-emerald-600" /> Global Announcement Banner
                      </div>
                      <Toggle
                        checked={announcementEnabled}
                        onChange={setAnnouncementEnabled}
                        label="Enable System Announcement Banner"
                        desc="Display a broadcast notification message across citizen and agency dashboards."
                      />
                      {announcementEnabled && (
                        <div className="space-y-1.5 pt-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Announcement Text</label>
                          <input
                            type="text"
                            value={announcementMessage}
                            onChange={(e) => setAnnouncementMessage(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSystem}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 disabled:opacity-70"
                  >
                    {isSavingSystem ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Check className="h-4.5 w-4.5" />}
                    {isSavingSystem ? 'Saving System Configuration...' : 'Apply System Controls'}
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <AlertModal isOpen={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
