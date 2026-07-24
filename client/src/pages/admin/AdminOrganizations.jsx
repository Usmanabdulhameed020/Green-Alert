import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useConfirm } from '../../components/ui/ConfirmModal';

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    const ok = await confirm('Are you sure you want to delete this organization?');
    if (!ok) return;
    try {
      await axios.delete(`/api/v1/admin/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Organizations</h1>
        <p className="text-sm text-slate-500 mt-1">Verify and manage environmental organizations.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
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
              {!org.verified ? (
                <button onClick={() => handleVerify(org._id)}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                ><CheckCircle className="h-3.5 w-3.5" /> Verify</button>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 mb-3">
              <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" />{org.email}</div>
              {org.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{org.phone}</div>}
              {org.address && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{org.address}</div>}
              <div className="text-[10px] font-bold uppercase text-slate-400">{org.category || 'N/A'}</div>
            </div>

            <button onClick={() => handleDelete(org._id)}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-all cursor-pointer"
            ><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">No organizations found.</div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}
