import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Grid,
  List,
  MapPin,
  Calendar,
  AlertCircle,
  Bookmark,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';
import { useConfirm } from '../../components/ui/ConfirmModal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=600&auto=format&fit=crop';

export default function MyReports() {
  const { reports, savedReports, toggleSaveReport, deleteReport, isLoading, setReports } = useCitizen();
  const { confirm, ConfirmDialog } = useConfirm();
  const { on } = useSocket();
  const navigate = useNavigate();

  // Real-time report updates
  useEffect(() => {
    const offStatus = on('report:status-changed', (updatedReport) => {
      setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
    });
    const offAssigned = on('report:assigned', (updatedReport) => {
      setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
    });
    return () => { offStatus(); offAssigned(); };
  }, [on, setReports]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [tab, setTab] = useState('ongoing');
  const [visibleCount, setVisibleCount] = useState(9);
  const ITEMS_PER_PAGE = 9;

  const isTerminal = (s) => s === 'Resolved' || s === 'Closed';

  // Filter & Sort Reports
  const filteredReports = reports
    .filter((r) => {
      if (tab === 'ongoing' && isTerminal(r.status)) return false;
      if (tab === 'history' && !isTerminal(r.status)) return false;
      const matchesSearch =
        (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Reset pagination when filters/tab changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, statusFilter, sortBy, tab]);

  if (isLoading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  const displayedReports = filteredReports.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReports.length;

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Critical': return 'text-red-700 bg-red-50 border-red-100';
      case 'High': return 'text-orange-700 bg-orange-50 border-orange-100';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Reports</h1>
          <p className="text-slate-500 text-sm font-semibold">{filteredReports.length} {tab} report{filteredReports.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/citizen-dashboard/create-report')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 active:scale-98 cursor-pointer self-start sm:self-center text-sm"
        >
          + Submit New Report
        </button>
      </div>

      {/* Ongoing / History Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('ongoing')}
          className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            tab === 'ongoing' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Ongoing
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            tab === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          History
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search reports by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>

        {/* Dropdowns & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none pr-8"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none pr-8"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Layout Toggles */}
          <div className="border border-slate-200 rounded-xl p-1 flex gap-1 bg-slate-50/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Display Container */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <EmptyState
            title={searchQuery || statusFilter !== 'All' ? 'No reports matched your filters' : 'You haven\'t logged any reports yet'}
            description={searchQuery || statusFilter !== 'All' ? 'Try adjusting your search keywords or resetting filters.' : 'Submit your first environmental report to help route problems in your area.'}
            actionLabel={searchQuery || statusFilter !== 'All' ? 'Reset Filters' : 'Report an Incident'}
            onAction={
              searchQuery || statusFilter !== 'All'
                ? () => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }
                : () => navigate('/citizen-dashboard/create-report')
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReports.map((report) => {
            const isSaved = savedReports.includes(report.id || report._id);
            return (
              <motion.div
                key={report.id || report._id}
                layout
                whileHover={{ y: -3 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div className="relative h-44 w-full bg-slate-100 flex-shrink-0">
                  <img
                    src={report.imageUrl || FALLBACK_IMAGE}
                    alt={report.title}
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-200/50 uppercase tracking-wider">
                      {report.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm('Are you sure you want to delete this report?');
                          if (!ok) return;
                          try {
                            await deleteReport(report.id || report._id);
                          } catch {}
                        }}
                        className="p-1.5 rounded-full backdrop-blur-md shadow-sm border bg-rose-500/20 text-rose-400 border-rose-500/20 hover:bg-rose-500/40 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveReport(report.id || report._id);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md shadow-sm border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            : 'bg-black/20 text-white/80 border-white/10 hover:bg-black/30'
                        }`}
                      >
                        <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2">
                      {report.title}
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{report.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span>
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <StatusBadge status={report.status} />
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(report.priority)}`}>
                        {report.priority || 'Medium'}
                      </span>
                      <button
                        onClick={() => navigate(`/citizen-dashboard/reports/${report.id || report._id}`)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List / Table Layout */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-0">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 border-slate-200">
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Report Title</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Location</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedReports.map((report) => {
                  const isSaved = savedReports.includes(report.id || report._id);
                  return (
                    <tr key={report.id || report._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-sm text-slate-800 max-w-xs truncate">
                        {report.title}
                      </td>
                      <td className="p-5 text-xs font-semibold text-slate-600">
                        {report.category}
                      </td>
                      <td className="p-5 text-xs text-slate-500 font-semibold max-w-[150px] truncate">
                        {report.location}
                      </td>
                      <td className="p-5">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="p-5">
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(report.priority)}`}>
                          {report.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-slate-500 font-medium">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="p-5 text-right space-x-2.5">
                        <button
                          onClick={async () => {
                            const ok = await confirm('Are you sure you want to delete this report?');
                            if (!ok) return;
                            try {
                              await deleteReport(report.id || report._id);
                            } catch {}
                          }}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleSaveReport(report.id || report._id)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer inline-flex items-center justify-center ${
                            isSaved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => navigate(`/citizen-dashboard/reports/${report.id || report._id}`)}
                          className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            className="px-6 py-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            Load More ({filteredReports.length - visibleCount} remaining)
          </button>
        </div>
      )}
      <ConfirmDialog />
    </motion.div>
  );
}
