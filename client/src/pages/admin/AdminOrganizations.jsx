import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Building2, Mail, Phone, MapPin, Globe, CheckCircle, XCircle, Trash2,
  Eye, X, FileText, Calendar, User, ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useConfirm } from '../../components/ui/ConfirmModal';

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewOrg, setReviewOrg] = useState(null);
  const { token } = useCitizen();
  const { confirm, ConfirmDialog } = useConfirm();

  const fetchOrgs = async () => {
    try {
      const { data } = await axios.get('/api/v1/admin/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrgs(data);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, [token]);

  const handleVerify = async (orgId) => {
    try {
      await axios.patch(`/api/v1/admin/organizations/${orgId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrgs();
    } catch (err) {
      console.error('Verify failed:', err);
    }
  };

  const handleDelete = async (orgId) => {
    const ok = await confirm('Are you sure you want to delete this organization? This will also delete the linked user account.');
    if (!ok) return;
    try {
      await axios.delete(`/api/v1/admin/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reviewOrg?._id === orgId) setReviewOrg(null);
      fetchOrgs();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filtered = orgs.filter((o) =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Organizations</h1>
        <p className="text-sm text-slate-500 mt-1">Verify and manage environmental organizations.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((org, i) => (
          <motion.div key={org._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{org.name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    org.verified ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                  }`}>{org.verified ? 'Verified' : 'Unverified'}</span>
                </div>
              </div>
              <button onClick={() => setReviewOrg(org)}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
              ><Eye className="h-3.5 w-3.5" /> Review</button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 mb-3">
              <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" />{org.email}</div>
              {org.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{org.phone}</div>}
              {org.address && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{org.address}</div>}
              <div className="text-[10px] font-bold uppercase text-slate-400">{org.category || 'N/A'}</div>
            </div>

            <div className="flex gap-2">
              {!org.verified && (
                <button onClick={() => handleVerify(org._id)}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                ><CheckCircle className="h-3.5 w-3.5" /> Verify</button>
              )}
              <button onClick={() => handleDelete(org._id)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              ><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">No organizations found.</div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setReviewOrg(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">{reviewOrg.name}</h2>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      reviewOrg.verified ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                    }`}>{reviewOrg.verified ? 'Verified' : 'Unverified'}</span>
                  </div>
                </div>
                <button onClick={() => setReviewOrg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{reviewOrg.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</h3>
                    <p className="text-xs font-semibold text-slate-800">{reviewOrg.category || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">License Number</h3>
                    <p className="text-xs font-semibold text-slate-800">{reviewOrg.licenseNumber || '—'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Contact Information</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${reviewOrg.email}`} className="text-amber-600 hover:underline font-semibold">{reviewOrg.email}</a>
                  </div>
                  {reviewOrg.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      {reviewOrg.phone}
                    </div>
                  )}
                  {reviewOrg.website && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Globe className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <a href={reviewOrg.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-semibold flex items-center gap-1">
                        {reviewOrg.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {reviewOrg.address && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      {reviewOrg.address}
                    </div>
                  )}
                </div>

                {reviewOrg.licenseDocument && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">License Document</h3>
                    <a href={reviewOrg.licenseDocument} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl px-4 py-3 transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      View License Document
                      <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                    </a>
                  </div>
                )}

                <hr className="border-slate-100" />

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-600">
                    {reviewOrg.user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{reviewOrg.user?.fullName || 'Unknown'}</p>
                    <p className="text-[11px] text-slate-500">{reviewOrg.user?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Registered on {new Date(reviewOrg.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-100">
                {!reviewOrg.verified && (
                  <button onClick={() => { handleVerify(reviewOrg._id); setReviewOrg(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  ><CheckCircle className="h-4 w-4" /> Verify & Activate</button>
                )}
                <button onClick={() => { handleDelete(reviewOrg._id); }}
                  className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                ><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog />
    </div>
  );
}
