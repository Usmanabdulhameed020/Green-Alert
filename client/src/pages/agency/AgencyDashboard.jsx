import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  ClipboardList, Clock, CheckCircle, TrendingUp, BarChart3,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';

const statCards = [
  { label: 'Assigned Reports', key: 'totalAssigned', icon: ClipboardList, textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
  { label: 'In Progress', key: 'inProgress', icon: Clock, textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
  { label: 'Resolved', key: 'resolved', icon: CheckCircle, textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
  { label: 'Resolution Rate', key: 'resolutionRate', icon: TrendingUp, textColor: 'text-violet-600', bgLight: 'bg-violet-50', suffix: '%' },
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

export default function AgencyDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useCitizen();
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!stats) return <p className="text-slate-500 text-sm">Failed to load stats.</p>;

  const categoryData = Object.entries(stats.reportsByCategory || {}).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(stats.reportsByPriority || {}).map(([name, value]) => ({ name, value }));
  const maxCategory = Math.max(1, ...categoryData.map((d) => d.value));
  const maxPriority = Math.max(1, ...priorityData.map((d) => d.value));

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

      {/* Reports Over Time */}
      {stats.reportsByMonth && stats.reportsByMonth.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports Over Time</h2>
          <div className="h-44 flex items-end gap-3">
            {(() => {
              const max = Math.max(1, ...stats.reportsByMonth.map((m) => m.count));
              return stats.reportsByMonth.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-[11px] font-bold text-slate-600">{m.count}</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300" style={{ height: `${(m.count / max) * 100 || 2}%`, minHeight: '4px' }} />
                  <span className="text-[11px] font-semibold text-slate-400">{m.month}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports by Category</h2>
            <div className="space-y-3">
              {categoryData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="w-28 text-[11px] font-semibold text-slate-600 truncate">{d.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / maxCategory) * 100}%`, backgroundColor: categoryColors[d.name] || '#94a3b8' }} />
                  </div>
                  <span className="w-6 text-right text-[11px] font-bold text-slate-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {priorityData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4">Reports by Priority</h2>
            <div className="space-y-3">
              {priorityData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="w-28 text-[11px] font-semibold text-slate-600">{d.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / maxPriority) * 100}%`, backgroundColor: priorityColors[d.name] || '#94a3b8' }} />
                  </div>
                  <span className="w-6 text-right text-[11px] font-bold text-slate-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
