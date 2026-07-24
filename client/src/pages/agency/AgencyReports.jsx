import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, MapPin, User, Eye, Map as MapIcon, List, Layers,
  ArrowUpDown, ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import MapLibreMap from '../../components/map/MapLibreMap';

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Priority: High to Low', value: 'priority-desc' },
  { label: 'Priority: Low to High', value: 'priority-asc' },
  { label: 'Status: A-Z', value: 'status-asc' },
  { label: 'Status: Z-A', value: 'status-desc' },
];

const priorityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export default function AgencyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const { token, user } = useCitizen();
  const { on } = useSocket();
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const { data } = await axios.get('/api/v1/reports/agency-reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [token, user]);

  useEffect(() => {
    if (!on) return;
    const offAssigned = on('report:assigned', (report) => {
      if (report.assignedTo?._id === user?.organizationId || report.assignedTo === user?.organizationId) {
        setReports((prev) => {
          const idx = prev.findIndex((r) => r._id === report._id);
          if (idx >= 0) { const u = [...prev]; u[idx] = report; return u; }
          return [report, ...prev];
        });
      }
    });
    const offStatus = on('report:status-changed', (report) => {
      if (report.assignedTo?._id === user?.organizationId || report.assignedTo === user?.organizationId) {
        setReports((prev) => {
          const idx = prev.findIndex((r) => r._id === report._id);
          if (idx >= 0) { const u = [...prev]; u[idx] = report; return u; }
          return [report, ...prev];
        });
      }
    });
    return () => { offAssigned(); offStatus(); };
  }, [on, user?.organizationId]);

  const handleStatus = async (reportId, status) => {
    try {
      await axios.patch(`/api/v1/reports/${reportId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReports();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filtered = reports
    .filter((r) => {
      const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority-desc': return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        case 'priority-asc': return (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0);
        case 'status-asc': return (a.status || '').localeCompare(b.status || '');
        case 'status-desc': return (b.status || '').localeCompare(a.status || '');
        default: return new Date(b.createdAt) - new Date(a.createdAt); // newest
      }
    });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Assigned Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Manage reports assigned to your organization.</p>
        </div>
        <button
          onClick={() => setViewMode((p) => (p === 'list' ? 'map' : 'list'))}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer transition-all"
        >
          {viewMode === 'list' ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
          {viewMode === 'list' ? 'Map View' : 'List View'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="All">All Status</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 appearance-none"
          >
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-80 w-full">
            <MapLibreMap
              center={[3.3792, 6.5244]}
              zoom={8}
              showControls={false}
              markers={filtered.filter((r) => r.latitude && r.longitude).map(r => ({
                id: r._id,
                lng: r.longitude,
                lat: r.latitude,
                color: '#d97706',
                popupHtml: `
                  <div style="font-family: system-ui, sans-serif; max-width: 200px; padding: 2px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${(r.title || '').replace(/</g, '&lt;')}
                    </p>
                    <p style="margin: 0 0 4px; font-size: 10px; color: #64748b; font-weight: 600;">
                      ${(r.location || '').replace(/</g, '&lt;')}
                    </p>
                    <p style="margin: 0; font-size: 10px; font-weight: 700; color: #475569;">
                      ${(r.status || 'Unknown').replace(/_/g, ' ')} · ${r.priority || 'Medium'}
                    </p>
                    <a href="/agency/reports/${r._id}" style="display: inline-block; margin-top: 4px; font-size: 10px; font-weight: 700; color: #d97706; text-decoration: none;">
                      View Details →
                    </a>
                  </div>
                `,
              }))}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((report, i) => (
            <motion.div key={report._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-extrabold text-slate-900">{report.title}</h3>
                <select value={report.status} onChange={(e) => handleStatus(report._id, e.target.value)}
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border-0 cursor-pointer ${
                    report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                    report.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                    report.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                    report.status === 'In Progress' ? 'bg-violet-100 text-violet-700' :
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  <option>Assigned</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
                </select>
              </div>
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{report.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{report.location}</div>
                <div className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{report.user?.fullName || 'Unknown'}</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{report.category}</span>
                  {report.priority && (
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-lg ${
                      report.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                      report.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                      report.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{report.priority}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/agency/reports/${report._id}`)}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">No reports found.</div>
          )}
        </div>
      )}
    </div>
  );
}
