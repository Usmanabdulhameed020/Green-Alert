import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, Building2, User, MapPin, Clock, Eye } from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignModal, setAssignModal] = useState(null);
  const { token } = useCitizen();
  const { on } = useSocket();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [reportsRes, orgsRes] = await Promise.all([
        axios.get('/api/v1/admin/reports', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/admin/organizations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setReports(reportsRes.data);
      setOrganizations(orgsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // Real-time updates
  useEffect(() => {
    if (!on) return;
    const offAssigned = on('report:assigned', (updatedReport) => {
      setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
    });
    const offStatus = on('report:status-changed', (updatedReport) => {
      setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
    });
    const offCreated = on('report:new', (newReport) => {
      setReports((prev) => [newReport, ...prev]);
    });
    return () => { offAssigned(); offStatus(); offCreated(); };
  }, [on]);

  const handleAssign = async (reportId, orgId) => {
    try {
      await axios.patch(`/api/v1/admin/reports/${reportId}/assign`, { organizationId: orgId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignModal(null);
      fetchData();
    } catch (err) {
      console.error('Assign failed:', err);
    }
  };


  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.title?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all citizen reports on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="All">All Status</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[600px] sm:min-w-0">
            <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="text-left px-5 py-3.5">Title</th>
                <th className="text-left px-5 py-3.5">Reporter</th>
                <th className="text-left px-5 py-3.5">Location</th>
                <th className="text-left px-5 py-3.5">Category</th>
                <th className="text-left px-5 py-3.5">Status</th>
                <th className="text-left px-5 py-3.5">Assigned To</th>
                <th className="text-left px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report, i) => (
                <motion.tr key={report._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4 font-bold text-slate-800 max-w-[200px] truncate">{report.title}</td>
                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{report.user?.fullName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{report.location}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">{report.category}</span></td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                      report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                      report.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                      report.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                      report.status === 'In Progress' ? 'bg-violet-100 text-violet-700' :
                      report.status === 'Closed' ? 'bg-slate-200 text-slate-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {report.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[11px]">{report.assignedTo.name}</span>
                      </div>
                    ) : (
                      <button onClick={() => setAssignModal(report._id)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg cursor-pointer"
                      >Assign</button>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/admin/reports/${report._id}`)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button onClick={() => setAssignModal(report._id)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-lg cursor-pointer"
                      >Reassign</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredReports.length === 0 && (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-xs">No reports found.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Assign Report</h3>
            <p className="text-xs text-slate-500 mb-4">Select an organization to assign this report to.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {organizations
                .filter((o) => o.verified)
                .map((org) => (
                <button key={org._id} onClick={() => handleAssign(assignModal, org._id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-500" />
                    <div>
                      <p>{org.name}</p>
                      <p className="text-[10px] text-slate-500 font-normal">{org.category} · {org.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setAssignModal(null)}
              className="mt-4 w-full text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl cursor-pointer"
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
