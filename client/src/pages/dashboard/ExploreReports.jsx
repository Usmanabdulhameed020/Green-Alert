import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Globe, Eye, User } from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=600&auto=format&fit=crop';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const categoryPills = [
  'All',
  'Illegal Dumping',
  'Blocked Drainage',
  'Oil Spill',
  'Air Pollution',
  'Water Pollution',
  'Flooding',
  'Deforestation'
];

export default function ExploreReports() {
  const { allReports, fetchAllReports, isLoading } = useCitizen();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchAllReports();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="h-7 w-7 text-emerald-600 animate-spin-slow" />
            Explore Reports
          </h1>
          <p className="text-slate-500 text-sm font-semibold">Monitor environmental incident reports log in the community</p>
        </div>
        <LoadingSkeleton type="report-card" count={6} />
      </div>
    );
  }

  const filteredExplore = allReports.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'Active') {
      matchesStatus = r.status !== 'Resolved' && r.status !== 'Closed';
    } else if (statusFilter === 'Resolved') {
      matchesStatus = r.status === 'Resolved' || r.status === 'Closed';
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Block */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Globe className="h-7 w-7 text-emerald-600 animate-spin-slow" />
          Explore Reports
        </h1>
        <p className="text-slate-500 text-sm font-semibold">Monitor environmental incident reports log in the community</p>
      </div>

      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search community incidents by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Status buttons */}
          <div className="flex gap-2 bg-slate-50/50 p-1 border border-slate-200 rounded-xl self-start sm:self-center">
            {['All', 'Active', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
          {categoryPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setActiveCategory(pill)}
              className={`px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === pill
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Explore Grid */}
      {filteredExplore.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <EmptyState
            title="No community reports match filters"
            description="Adjust your filters or query text above to view reported environmental cases."
            actionLabel="Reset Search Filters"
            onAction={() => {
              setSearchQuery('');
              setActiveCategory('All');
              setStatusFilter('All');
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExplore.map((report) => (
            <div
              key={report.id || report._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Card visual banner */}
              <div className="h-44 w-full bg-slate-100 relative">
                <img
                  src={report.imageUrl || FALLBACK_IMAGE}
                  alt={report.title}
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-bold text-slate-700 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-200/50 uppercase tracking-wider">
                    {report.category}
                  </span>
                </div>
              </div>

              {/* Card details */}
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
                  {report.user && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {report.user.avatar ? (
                          <img src={report.user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        {report.user.fullName || 'Anonymous'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <StatusBadge status={report.status} />
                  <button
                    onClick={() => navigate(`/citizen-dashboard/reports/${report.id || report._id}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
