import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  FileSearch,
  Map,
  Bell,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Leaf,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Animated Counter helper
const AnimatedNumber = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 800; // ms
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
};

const tips = [
  'Reduce single-use plastics to protect local water bodies.',
  'Report illegal dumping immediately - it takes under 2 minutes to alert responders.',
  'Plant native trees and flowers to support local insect and bird populations.',
  'Fix dripping taps promptly - a leaking tap wastes up to 15 liters of water a day.',
  'Walk, cycle, or use public transport to decrease carbon emission levels.',
];

export default function DashboardHome() {
  const { user: contextUser, reports, isLoading } = useCitizen();
  const navigate = useNavigate();

  // Fallback to localStorage for user data to handle first-load timing after login
  const user = React.useMemo(() => {
    if (contextUser) return contextUser;
    try {
      const savedUser = localStorage.getItem('greenalert_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  }, [contextUser]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Rotate tips
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  // Derive counts
  const totalReports = reports.length;
  const inProgressReports = reports.filter((r) => r.status === 'In Progress').length;
  const resolvedReports = reports.filter((r) => r.status === 'Resolved').length;
  const pendingReports = reports.filter((r) => ['Submitted', 'Under Review'].includes(r.status)).length;

  // Prepare chart data: group reports by month
  const getChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((m) => ({ name: m, Reports: 0 }));

    reports.forEach((r) => {
      if (r.createdAt) {
        const date = new Date(r.createdAt);
        const monthIndex = date.getMonth();
        data[monthIndex].Reports += 1;
      }
    });

    // Return the last 6 months that have data or just 6 months
    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - 5);
    return data.slice(start, currentMonth + 1);
  };

  const chartData = getChartData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute right-1/4 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-4">
          <span className="bg-emerald-500/30 text-emerald-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/20">
            Citizen Dashboard
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || 'Citizen'}!
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl leading-relaxed">
            Your environmental reports are directly helping government agencies and local NGOs build cleaner, safer, and more resilient neighborhoods.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => navigate('/citizen-dashboard/create-report')}
              className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer text-sm"
            >
              + Submit New Report
            </button>
            <span className="text-emerald-100 text-sm font-semibold">
              {totalReports} reports logged from your account
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Report New Issue',
              desc: 'Submit a new environmental incident',
              icon: PlusCircle,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-200',
              path: '/citizen-dashboard/create-report',
            },
            {
              title: 'Track My Reports',
              desc: 'Monitor details and status workflows',
              icon: FileSearch,
              color: 'text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-200',
              path: '/citizen-dashboard/my-reports',
            },
            {
              title: 'Explore Map',
              desc: 'View reported cases in your area',
              icon: Map,
              color: 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-200',
              path: '/citizen-dashboard/map',
            },
            {
              title: 'Notifications',
              desc: 'Check recent updates and notes',
              icon: Bell,
              color: 'text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-200',
              path: '/citizen-dashboard/notifications',
            },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => navigate(action.path)}
                className={`w-full text-left p-5 bg-white border rounded-2xl transition-all shadow-sm cursor-pointer flex flex-col justify-between h-40 ${action.color}`}
              >
                <div className="p-3 rounded-xl bg-white shadow-sm self-start">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[15px]">{action.title}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{action.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reports', value: totalReports, icon: ShieldAlert, color: 'text-slate-500 bg-slate-50 border-slate-200' },
          { label: 'In Progress', value: inProgressReports, icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200' },
          { label: 'Resolved Reports', value: resolvedReports, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Pending Review', value: pendingReports, icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm`}
            >
              <div className="space-y-1">
                <p className="text-slate-500 text-xs font-semibold">{card.label}</p>
                <p className="text-3xl font-extrabold text-slate-900">
                  <AnimatedNumber value={card.value} />
                </p>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Tips Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Activity Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Reporting Activity</h3>
              <p className="text-xs text-slate-500 font-medium">Environmental issues logged over recent months</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold">
              <TrendingUp className="h-4 w-4" />
              Live Feed
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0' }} />
                <Area type="monotone" dataKey="Reports" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReports)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Tips */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl self-start">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="space-y-3 my-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Eco Tip of the Day</h4>
            <p className="text-slate-800 font-semibold text-lg leading-relaxed transition-all duration-300">
              "{tips[currentTipIndex]}"
            </p>
          </div>
          <div className="flex gap-1.5 justify-start">
            {tips.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTipIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentTipIndex === idx ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports List */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent Environmental Issues</h3>
            <p className="text-xs text-slate-500 font-medium">Your most recent incident reports and their status</p>
          </div>
          <Link
            to="/citizen-dashboard/my-reports"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition-colors"
          >
            View All Reports
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {reports.length === 0 ? (
          <EmptyState
            title="No reports logged yet"
            description="Start by logging an environmental issue in your neighborhood like illegal dumping or blocked drainages."
            actionLabel="Report Your First Issue"
            actionPath="/citizen-dashboard/create-report"
          />
        ) : (
          <div className="divide-y divide-slate-150">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id || report._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      #{report.id?.slice(-6).toUpperCase() || report._id?.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      {report.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{report.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold">{report.location}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <StatusBadge status={report.status} />
                  <button
                    onClick={() => navigate(`/citizen-dashboard/reports/${report.id || report._id}`)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
