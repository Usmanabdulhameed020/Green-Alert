import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, AlertTriangle, TrendingUp,
  BarChart3, MapPin, User, Calendar,
} from 'lucide-react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';

const statCards = [
  { label: 'Assigned Reports', key: 'totalAssigned', icon: ClipboardList, color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
  { label: 'In Progress', key: 'inProgress', icon: Clock, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
  { label: 'Resolved', key: 'resolved', icon: AlertTriangle, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
  { label: 'Resolution Rate', key: 'resolutionRate', icon: TrendingUp, color: 'bg-violet-500', textColor: 'text-violet-600', bgLight: 'bg-violet-50', suffix: '%' },
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

const priorityColorsMap = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#94a3b8',
};

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useCitizen();
  const { on } = useSocket();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          axios.get('/api/v1/agency/stats', { headers }),
          axios.get('/api/v1/reports/agency-reports', { headers }),
        ]);
        setStats(statsRes.data);
        setReports(reportsRes.data);
      } catch (err) {
        console.error('Failed to fetch agency data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Real-time updates
  useEffect(() => {
    if (!on) return;
    const refreshStats = () => {
      axios.get('/api/v1/agency/stats', { headers })
        .then(({ data }) => setStats(data))
        .catch(() => {});
    };
    const offStatus = on('report:status-changed', (updated) => {
      setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      refreshStats();
    });
    const offAssigned = on('report:assigned', (updated) => {
      setReports((prev) => {
        const idx = prev.findIndex((r) => r._id === updated._id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [updated, ...prev];
      });
      refreshStats();
    });
    return () => { offStatus(); offAssigned(); };
  }, [on, token]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!stats) return <p className="text-slate-500 text-sm">Failed to load stats.</p>;

  const categoryData = Object.entries(stats.reportsByCategory || {}).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(stats.reportsByPriority || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Agency Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.fullName || user?.name}.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm"
          >
            <div className={`h-12 w-12 rounded-xl ${card.bgLight} flex items-center justify-center`}>
              <card.icon className={`h-6 w-6 ${card.textColor}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{stats[card.key]}{card.suffix || ''}</p>
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'New This Week', count: stats.newThisWeek, icon: BarChart3, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-600', iconColor: 'text-amber-500' },
          { label: 'Assigned', count: stats.assigned, icon: ClipboardList, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-600', iconColor: 'text-blue-500' },
          { label: 'Submitted', count: stats.submitted, icon: Clock, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-600', iconColor: 'text-purple-500' },
          { label: 'Closed', count: stats.closed, icon: TrendingUp, color: 'bg-slate-50 border-slate-200', textColor: 'text-slate-600', iconColor: 'text-slate-500' },
        ].map((widget, i) => (
          <motion.div key={widget.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
            className={`${widget.color} border rounded-xl p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <widget.icon className={`h-5 w-5 ${widget.iconColor}`} />
              <span className="text-lg font-extrabold text-slate-900">{widget.count ?? 0}</span>
            </div>
            <p className={`text-xs font-bold ${widget.textColor}`}>{widget.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        {stats.reportsByMonth && stats.reportsByMonth.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports Over Time</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.reportsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Donut */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports by Category</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
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
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Reports">
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={priorityColorsMap[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-800">My Assigned Reports</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.length > 0 ? reports.slice(0, 10).map((report) => (
            <div key={report._id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{report.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{report.location} · {report.category}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {report.priority && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                    report.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                    report.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                    report.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{report.priority}</span>
                )}
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                  report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                  report.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                  report.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                  report.status === 'In Progress' ? 'bg-violet-100 text-violet-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{report.status}</span>
              </div>
            </div>
          )) : <p className="px-5 py-4 text-xs text-slate-500">No reports assigned yet.</p>}
        </div>
      </div>
    </div>
  );
}
