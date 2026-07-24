import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bookmark,
  Search,
  Grid,
  List,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=600&auto=format&fit=crop';

export default function SavedReports() {
  const { reports, savedReports, toggleSaveReport } = useCitizen();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Filter bookmarked reports
  const bookmarkedReports = reports.filter(
    (r) => savedReports.includes(r.id || r._id) &&
    ((r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (r.location || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Header Block */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bookmark className="h-7 w-7 text-emerald-600" fill="currentColor" />
          Saved Reports
        </h1>
        <p className="text-slate-500 text-sm font-semibold">
          {bookmarkedReports.length} bookmarked environmental issues monitored
        </p>
      </div>

      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search bookmarked reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        </div>

        {/* View Toggle */}
        <div className="border border-slate-200 rounded-xl p-1 flex gap-1 bg-slate-50/50 self-start sm:self-center">
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

      {/* Display List / Grid */}
      {bookmarkedReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <EmptyState
            icon={Bookmark}
            title={searchQuery ? 'No saved reports match query' : 'No bookmarked reports yet'}
            description={searchQuery ? 'Try adjusting your search criteria.' : 'Bookmark incident reports to monitor updates and responder activity quickly.'}
            actionLabel={searchQuery ? 'Reset search' : 'Browse Incidents'}
            onAction={searchQuery ? () => setSearchQuery('') : () => navigate('/citizen-dashboard/explore')}
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedReports.map((report) => (
            <motion.div
              key={report.id || report._id}
              layout
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              {/* Card visual banner */}
              <div className="h-44 w-full bg-slate-100 relative flex-shrink-0">
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
                  <button
                    onClick={() => toggleSaveReport(report.id || report._id)}
                    className="p-1.5 rounded-full backdrop-blur-md shadow-sm border bg-emerald-500/20 text-emerald-400 border-emerald-500/20 cursor-pointer"
                  >
                    <Bookmark className="h-4 w-4" fill="currentColor" />
                  </button>
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

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <StatusBadge status={report.status} />
                  <button
                    onClick={() => navigate(`/citizen-dashboard/reports/${report.id || report._id}`)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 border-slate-200">
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Report Title</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="p-5 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookmarkedReports.map((report) => (
                  <tr key={report.id || report._id} className="hover:bg-slate-55/50 transition-colors">
                    <td className="p-5 font-bold text-sm text-slate-800 max-w-xs truncate">{report.title}</td>
                    <td className="p-5 text-xs font-semibold text-slate-600">{report.category}</td>
                    <td className="p-5 text-xs text-slate-500 font-medium truncate max-w-[150px]">{report.location}</td>
                    <td className="p-5">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="p-5 text-right space-x-2.5">
                      <button
                        onClick={() => toggleSaveReport(report.id || report._id)}
                        className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl cursor-pointer"
                      >
                        <Bookmark className="h-4 w-4" fill="currentColor" />
                      </button>
                      <button
                        onClick={() => navigate(`/citizen-dashboard/reports/${report.id || report._id}`)}
                        className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 text-xs font-bold rounded-xl cursor-pointer inline-flex items-center"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
