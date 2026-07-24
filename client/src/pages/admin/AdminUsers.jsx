import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Mail, Shield, Trash2, Calendar, Ban, CheckCircle, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import AlertModal from '../../components/ui/AlertModal';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { token } = useCitizen();
  const [alertMsg, setAlertMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [banReason, setBanReason] = useState('');
  const [banModal, setBanModal] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/v1/admin/users', { headers });
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setAlertMsg('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = filtered.map(u => u._id);
    if (filtered.every(u => selected.has(u._id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredIds));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/v1/admin/users/${deleteTarget._id}`, { headers });
      setAlertMsg('User deleted successfully.');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    }
  };

  const confirmBan = async () => {
    if (!banModal) return;
    try {
      if (banModal.type === 'single') {
        const { data } = await axios.patch(`/api/v1/admin/users/${banModal.user._id}/ban`, { reason: banReason }, { headers });
        setAlertMsg(data.message || 'User banned successfully.');
      } else if (banModal.type === 'bulk') {
        const { data } = await axios.post('/api/v1/admin/users/bulk-ban', { userIds: banModal.userIds, reason: banReason }, { headers });
        setAlertMsg(data.message || 'Users banned successfully.');
      }
      setBanModal(null);
      setBanReason('');
      setSelected(new Set());
      fetchUsers();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to ban user(s).');
    }
  };

  const handleUnban = async (user) => {
    try {
      const { data } = await axios.patch(`/api/v1/admin/users/${user._id}/unban`, {}, { headers });
      setAlertMsg(data.message || 'User unbanned successfully.');
      fetchUsers();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to unban user.');
    }
  };

  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all registered users.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
        />
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <span className="text-xs font-bold text-rose-700">{selected.size} user(s) selected</span>
          <button onClick={() => setBanModal({ type: 'bulk', userIds: [...selected] })}
            className="flex items-center gap-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <Ban className="h-3.5 w-3.5" /> Ban Selected
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1.5 cursor-pointer"
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[650px] sm:min-w-0">
            <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-3 py-3.5 w-10">
                  <input type="checkbox" checked={filtered.length > 0 && filtered.every(u => selected.has(u._id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-5 py-3.5">Name</th>
                <th className="text-left px-5 py-3.5">Email</th>
                <th className="text-left px-5 py-3.5">Role</th>
                <th className="text-left px-5 py-3.5">Status</th>
                <th className="text-left px-5 py-3.5">Joined</th>
                <th className="text-left px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, i) => (
                <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`hover:bg-slate-50/80 ${u.status === 'banned' ? 'bg-red-50/30' : ''}`}
                >
                  <td className="px-3 py-4">
                    <input type="checkbox" checked={selected.has(u._id)} onChange={() => toggleSelect(u._id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${u.status === 'banned' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <User className={`h-4 w-4 ${u.status === 'banned' ? 'text-red-500' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <span className={`font-bold ${u.status === 'banned' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{u.fullName}</span>
                        {u.banReason && <p className="text-[10px] text-red-500 mt-0.5">Reason: {u.banReason}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className={u.status === 'banned' ? 'text-slate-400' : 'text-slate-600'}>{u.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                      u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' :
                      u.role === 'agency' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    {u.status === 'banned' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                        <Ban className="h-3 w-3" /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {u.role !== 'admin' && (
                        u.status === 'banned' ? (
                          <button onClick={() => {
                            setBanReason('');
                            handleUnban(u);
                          }}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Unban
                          </button>
                        ) : (
                          <button onClick={() => {
                            setBanReason('');
                            setBanModal({ type: 'single', user: u });
                          }}
                            className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <Ban className="h-3.5 w-3.5" /> Ban
                          </button>
                        )
                      )}
                      {u.role !== 'admin' && (
                        <button onClick={() => setDeleteTarget(u)}
                          className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-xs">No users found.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={!!deleteTarget}
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This will also remove their reports and organizations.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
        confirmText="Delete"
        confirmDanger
      />

      {/* Ban Reason Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-800">
                {banModal.type === 'bulk' ? `Ban ${banModal.userIds.length} User(s)` : `Ban ${banModal.user.fullName}`}
              </h3>
              <button onClick={() => { setBanModal(null); setBanReason(''); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Provide a reason for the ban (optional):</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              className="w-full text-xs border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="Violation of terms of service..."
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => { setBanModal(null); setBanReason(''); }}
                className="text-xs font-bold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button onClick={confirmBan}
                className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-lg transition-all cursor-pointer"
              >
                Ban {banModal.type === 'bulk' ? `(${banModal.userIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      <AlertModal isOpen={!!alertMsg && !deleteTarget && !banModal} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
