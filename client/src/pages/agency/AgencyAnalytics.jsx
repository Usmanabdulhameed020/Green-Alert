import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Activity, BarChart3, Calendar,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useToast } from '../../contexts/ToastContext';

const statCards = [
  { label: 'Total Reports', key: 'totalReports', icon: ClipboardList, color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
  { label: 'Resolved', key: 'resolvedReports', icon: CheckCircle, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
  { label: 'In Progress', key: 'inProgressReports', icon: Clock, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
  { label: 'Pending', key: 'pendingReports', icon: AlertTriangle, color: 'bg-violet-500', textColor: 'text-violet-600', bgLight: 'bg-violet-50' },
];

const categoryColors = [
  'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-violet-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
];

const statusColors = {
  Resolved: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-emerald-100 text-emerald-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
  Submitted: 'bg-violet-100 text-violet-700',
  Assigned: 'bg-cyan-100 text-cyan-700',
};

const priorityColors = {
  Critical: 'bg-red-50 text-red-700',
  High: 'bg-orange-50 text-orange-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-slate-100 text-slate-600',
};

export default function AgencyAnalytics() {
  const navigate = useNavigate();
  const { token } = useCitizen();
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await axios.get('/api/v1/agency/analytics', { headers });
        setAnalytics(data);
      } catch (err) {
        addToast('Failed to load analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return <p className="text-slate-500 text-sm">Failed to load analytics.</p>;
  }

  const categoryEntries = Object.entries(analytics.reportsByCategory || {});
  const maxCategoryCount = Math.max(...categoryEntries.map(([, v]) => v), 1);
  const maxMonthCreated = Math.max(...analytics.reportsByMonth.map((m) => m.created), 1);
  const maxMonthResolved = Math.max(...analytics.reportsByMonth.map((m) => m.resolved), 1);
  const maxMonth = Math.max(maxMonthCreated, maxMonthResolved, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Detailed insights into your agency's report handling performance.</p>
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
              <p className="text-2xl font-extrabold text-slate-900">{analytics[card.key]}</p>
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Avg Resolution Time */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold">{analytics.averageResolutionTime} days</p>
            <p className="text-xs font-semibold text-emerald-100">Average Resolution Time</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Category - CSS Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-extrabold text-slate-800">Reports by Category</h2>
          </div>
          {categoryEntries.length > 0 ? (
            <div className="space-y-3">
              {categoryEntries.map(([name, count], i) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{name}</span>
                    <span className="text-xs font-bold text-slate-500">{count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCategoryCount) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                      className={`h-full rounded-full ${categoryColors[i % categoryColors.length]}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">No category data available.</p>
          )}
        </motion.div>

        {/* Reports by Month - Timeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-extrabold text-slate-800">Reports by Month</h2>
          </div>
          <div className="flex items-end gap-2 h-48">
            {analytics.reportsByMonth.map((item, i) => (
              <div key={item.monthKey} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '140px' }}>
                  <div className="flex-1 flex flex-col justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.created / maxMonth) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                      className="w-full bg-amber-400 rounded-t-sm min-h-[2px]"
                      title={`Created: ${item.created}`}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.resolved / maxMonth) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.35 + i * 0.05 }}
                      className="w-full bg-emerald-400 rounded-t-sm min-h-[2px]"
                      title={`Resolved: ${item.resolved}`}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-500 text-center leading-tight">{item.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
              <span className="text-[10px] font-bold text-slate-500">Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
              <span className="text-[10px] font-bold text-slate-500">Resolved</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-extrabold text-slate-800">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {analytics.recentActivity.length > 0 ? analytics.recentActivity.map((report) => (
            <div
              key={report._id}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/agency/reports/${report._id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{report.title}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {report.location} &middot; {report.category}
                  {report.user && ` &middot; by ${report.user.fullName}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {report.priority && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${priorityColors[report.priority] || 'bg-slate-100 text-slate-600'}`}>
                    {report.priority}
                  </span>
                )}
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${statusColors[report.status] || 'bg-slate-100 text-slate-600'}`}>
                  {report.status}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )) : (
            <p className="px-5 py-4 text-xs text-slate-500">No recent activity.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
