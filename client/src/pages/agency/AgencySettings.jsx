import { useState, useEffect } from 'react';
import { Building2, User, Mail, Phone, Save, KeyRound, MapPin, Globe, FileText } from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useToast } from '../../contexts/ToastContext';

export default function AgencySettings() {
  const { user, token, updateUser } = useCitizen();
  const { success: toastSuccess } = useToast();
  const headers = { Authorization: `Bearer ${token}` };

  // Org profile
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState('');

  // User profile
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  // Password
  const [pwState, setPwState] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const { data } = await axios.get('/api/v1/agency/org', { headers });
        setOrg(data);
        setDescription(data.description || '');
        setOrgPhone(data.phone || '');
        setAddress(data.address || '');
        setWebsite(data.website || '');
      } catch {
        setOrgError('Failed to load organization profile.');
      } finally {
        setOrgLoading(false);
      }
    };
    fetchOrg();
  }, [token]);

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    setOrgSaving(true);
    setOrgError('');
    try {
      await axios.patch('/api/v1/agency/org', { description, phone: orgPhone, address, website }, { headers });
      toastSuccess('Organization profile updated!');
    } catch (err) {
      setOrgError(err.response?.data?.message || 'Failed to update organization profile.');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateUser({ fullName, phone });
    setSaving(false);
    toastSuccess('Profile updated successfully!');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');

    if (pwState.newPassword !== pwState.confirmPassword) {
      setPwError('Passwords do not match');
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
      }, { headers });
      setPwState({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toastSuccess('Password changed successfully!');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your organization profile and security.</p>
      </div>

      <form onSubmit={handleSaveOrg} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Building2 className="h-5 w-5 text-amber-600" />
          <h2 className="text-sm font-extrabold text-slate-800">Organization Profile</h2>
        </div>
        {orgLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" /> Loading...
          </div>
        ) : (
          <>
            {orgError && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold text-rose-600">{orgError}</div>}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={org?.name || ''} disabled className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={org?.category || ''} disabled className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={org?.email || ''} disabled className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
              </div>
            </div>
            <button type="submit" disabled={orgSaving} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50">
              <Save className="h-4 w-4" />
              {orgSaving ? 'Saving...' : 'Save Organization'}
            </button>
          </>
        )}
      </form>

      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <User className="h-5 w-5 text-amber-600" />
          <h2 className="text-sm font-extrabold text-slate-800">Account Profile</h2>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={user?.email || ''} disabled className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <KeyRound className="h-5 w-5 text-amber-600" />
          <h2 className="text-sm font-extrabold text-slate-800">Change Password</h2>
        </div>
        {pwError && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold text-rose-600">{pwError}</div>}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
          <input type="password" value={pwState.currentPassword} onChange={(e) => setPwState({ ...pwState, currentPassword: e.target.value })} required className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
          <input type="password" value={pwState.newPassword} onChange={(e) => setPwState({ ...pwState, newPassword: e.target.value })} required minLength={6} className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
          <input type="password" value={pwState.confirmPassword} onChange={(e) => setPwState({ ...pwState, confirmPassword: e.target.value })} required minLength={6} className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
        </div>
        <button type="submit" disabled={pwSaving} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50">
          <KeyRound className="h-4 w-4" />
          {pwSaving ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
