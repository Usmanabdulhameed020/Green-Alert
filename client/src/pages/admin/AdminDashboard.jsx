import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, Users, Building2, AlertTriangle, TrendingUp, Clock,
  Search, CheckCircle, Ban, MapPin, User, Mail, Shield, Calendar,
  Wrench, Megaphone, ToggleLeft, ToggleRight, Save,
} from 'lucide-react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import MapLibreMap from '../../components/map/MapLibreMap';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';

const statCards = [
  { label: 'Total Reports', key: 'totalReports', icon: ClipboardList, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
  { label: 'Pending Reports', key: 'pendingReports', icon: Clock, color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
  { label: 'Resolved Reports', key: 'resolvedReports', icon: AlertTriangle, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
  { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'bg-violet-500', textColor: 'text-violet-600', bgLight: 'bg-violet-50' },
  { label: 'Organizations', key: 'totalOrganizations', icon: Building2, color: 'bg-sky-500', textColor: 'text-sky-600', bgLight: 'bg-sky-50' },
  { label: 'Verified Orgs', key: 'verifiedOrganizations', icon: TrendingUp, color: 'bg-teal-500', textColor: 'text-teal-600', bgLight: 'bg-teal-50' },
];

const categoryColors = {
  'Illegal Dumping': '#64748b',
  'Blocked Drainage': '#06b6d4',
  'Oil Spill': '#f43f5e',
  'Air Pollution': '#8b5cf6',
  'Water Pollution': '#3b82f6',
  'Flooding': '#f59e0b',
  'Deforestation': '#10b981',
};

const priorityColors = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#94a3b8',
};

const workflowStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const { token } = useCitizen();
  const { on } = useSocket();

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/api/v1/admin/stats', { headers });
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/v1/system/settings');
        if (data.success) setSettings(data.data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const updateMaintenance = async () => {
    try {
      const { data } = await axios.patch('/api/v1/system/maintenance', {
        maintenanceMode: !settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
      }, { headers });
      if (data.success) setSettings(data.data);
    } catch (err) {
      console.error('Failed to update maintenance mode:', err);
    }
  };

  const updateMaintenanceMessage = async (message) => {
    setSettings(s => ({ ...s, maintenanceMessage: message }));
    try {
      await axios.patch('/api/v1/system/maintenance', {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: message,
      }, { headers });
    } catch (err) {
      console.error('Failed to update maintenance message:', err);
    }
  };

  const updateAnnouncement = async () => {
    try {
      const { data } = await axios.patch('/api/v1/system/announcement', {
        announcementEnabled: !settings.announcementEnabled,
        announcementMessage: settings.announcementMessage,
      }, { headers });
      if (data.success) setSettings(data.data);
    } catch (err) {
      console.error('Failed to update announcement:', err);
    }
  };

  const updateAnnouncementMessage = async (message) => {
    setSettings(s => ({ ...s, announcementMessage: message }));
    try {
      await axios.patch('/api/v1/system/announcement', {
        announcementEnabled: settings.announcementEnabled,
        announcementMessage: message,
      }, { headers });
    } catch (err) {
      console.error('Failed to update announcement message:', err);
    }
  };

  useEffect(() => {
    const refresh = () => {
      axios.get('/api/v1/admin/stats', { headers })
        .then(({ data }) => setStats(data))
        .catch(() => {});
    };
    const offStatus = on('report:status-changed', refresh);
    const offAssigned = on('report:assigned', refresh);
    const offNew = on('report:new', refresh);
    return () => { offStatus(); offAssigned(); offNew(); };
  }, [on, token]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await axios.patch(`/api/v1/reports/${reportId}/status`, { status: newStatus }, { headers });
      const { data } = await axios.get('/api/v1/admin/stats', { headers });
      setStats(data);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  if (!stats) return <p className="text-slate-500 text-sm">Failed to load stats.</p>;

  const categoryData = Object.entries(stats.reportsByCategory || {}).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(stats.reportsByPriority || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of the GreenAlert platform.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`h-12 w-12 rounded-xl ${card.bgLight} flex items-center justify-center`}>
              <card.icon className={`h-6 w-6 ${card.textColor}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{stats[card.key] ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Settings Cards: Maintenance & Announcement */}
      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Maintenance Mode */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Maintenance Mode</h2>
              </div>
              <button onClick={updateMaintenance} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${settings.maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">Message shown to non-admin users:</p>
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) => updateMaintenanceMessage(e.target.value)}
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="We are currently undergoing scheduled maintenance..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[10px] font-bold ${settings.maintenanceMode ? 'text-amber-600' : 'text-slate-400'}`}>
                {settings.maintenanceMode ? 'Active — non-admin users blocked' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Announcement Banner</h2>
              </div>
              <button onClick={updateAnnouncement} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${settings.announcementEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.announcementEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">Banner message shown to all users:</p>
            <textarea
              value={settings.announcementMessage}
              onChange={(e) => updateAnnouncementMessage(e.target.value)}
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Important announcement for all users..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[10px] font-bold ${settings.announcementEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                {settings.announcementEnabled ? 'Visible to all users' : 'Hidden'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Critical Reports', count: stats.criticalCount, icon: AlertTriangle, color: 'bg-red-50 border-red-200', textColor: 'text-red-600', iconColor: 'text-red-500', link: '/admin/reports' },
          { label: 'Pending Review', count: stats.pendingReviewCount, icon: Clock, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-600', iconColor: 'text-amber-500', link: '/admin/reports' },
          { label: 'Unverified Orgs', count: stats.unverifiedCount, icon: Building2, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-600', iconColor: 'text-purple-500', link: '/admin/organizations' },
          { label: 'Active Assignments', count: stats.assignedCount, icon: Users, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-600', iconColor: 'text-blue-500', link: '/admin/reports' },
        ].map((widget, i) => (
          <motion.button key={widget.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
            onClick={() => navigate(widget.link)}
            className={`${widget.color} border rounded-xl p-4 text-left cursor-pointer hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <widget.icon className={`h-5 w-5 ${widget.iconColor}`} />
              <span className="text-lg font-extrabold text-slate-900">{widget.count ?? 0}</span>
            </div>
            <p className={`text-xs font-bold ${widget.textColor}`}>{widget.label}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Click to view →</p>
          </motion.button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        {stats.reportsByMonth && stats.reportsByMonth.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.reportsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Donut Chart */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports by Category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={categoryColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Priority Bar Chart */}
      {priorityData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports by Priority</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Reports">
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={priorityColors[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Users + Pending Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800">Recent Users</h2>
            <button onClick={() => navigate('/admin/users')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">View All →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentUsers?.length > 0 ? stats.recentUsers.map((u) => (
              <div key={u._id} className="px-5 py-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${u.status === 'banned' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <User className={`h-4 w-4 ${u.status === 'banned' ? 'text-red-500' : 'text-emerald-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${u.status === 'banned' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{u.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                  u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' :
                  u.role === 'agency' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{u.role}</span>
                {u.status === 'banned' && <Ban className="h-3.5 w-3.5 text-red-400 shrink-0" />}
              </div>
            )) : <p className="px-5 py-4 text-xs text-slate-500">No users yet.</p>}
          </div>
        </div>

        {/* Pending Organizations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800">Pending Organizations</h2>
            <button onClick={() => navigate('/admin/organizations')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">View All →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.pendingOrganizations?.length > 0 ? stats.pendingOrganizations.map((org) => (
              <div key={org._id} className="px-5 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{org.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{org.email} · {org.category}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded shrink-0">Pending</span>
              </div>
            )) : <p className="px-5 py-4 text-xs text-slate-500">No pending organizations.</p>}
          </div>
        </div>
      </div>

      {/* Mini Map */}
      {stats.recentReports?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-800">Recent Reports Map</h2>
          </div>
          <div className="h-64 w-full">
            <MapLibreMap
              center={[3.3792, 6.5244]}
              zoom={6}
              static={true}
              showControls={false}
              markers={stats.recentReports.filter((r) => r.latitude && r.longitude).map(r => ({
                id: r._id,
                lng: r.longitude,
                lat: r.latitude,
                color: '#059669',
                popupHtml: `
                  <div style="font-family: system-ui, sans-serif; padding: 2px;">
                    <p style="margin: 0 0 2px; font-size: 12px; font-weight: 800; color: #1e293b;">${(r.title || '').replace(/</g, '&lt;')}</p>
                    <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">${(r.location || '').replace(/</g, '&lt;')}</p>
                  </div>
                `,
              }))}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Recent Reports with inline status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-800">Recent Reports</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.recentReports?.length > 0 ? stats.recentReports.map((report) => (
            <div key={report._id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{report.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{report.location} · {report.category}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Priority Badge */}
                {report.priority && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                    report.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                    report.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                    report.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{report.priority}</span>
                )}
                {/* Inline Status Select */}
                <select
                  value={report.status}
                  onChange={(e) => handleStatusChange(report._id, e.target.value)}
                  disabled={report.status === 'Closed'}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    report.status === 'Under Review' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    report.status === 'Assigned' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    report.status === 'Closed' ? 'bg-slate-200 text-slate-600 border-slate-300' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {workflowStatuses.map((s) => (
                    <option key={s} value={s} disabled={report.status === 'Closed' && s !== report.status}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )) : <p className="px-5 py-4 text-xs text-slate-500">No reports yet.</p>}
        </div>
      </div>
    </div>
  );
}
