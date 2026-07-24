import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Compass,
  Search,
  TrendingUp,
  ThumbsUp,
  Leaf,
  Plus,
  X,
  User,
  MessageSquare,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useConfirm } from '../../components/ui/ConfirmModal';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const ecoArticles = [
  {
    title: 'How to Categorize Waste at Home',
    readTime: '4 min read',
    desc: 'A comprehensive guide on separation practices for recyclable plastics, organic food scrap piles, and household chemical items.',
  },
  {
    title: 'Understanding Urban Runoffs',
    readTime: '7 min read',
    desc: 'Why blocked drainages flood neighborhoods and how local resident communities can coordinate trash clearance campaigns.',
  },
];

export default function CommunityPage() {
  const navigate = useNavigate();
  const { communities, fetchCommunities, createCommunity, joinCommunity, leaveCommunity, deleteCommunity, updateCommunity, user, reports } = useCitizen();
  const { confirm, ConfirmDialog } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedReports, setLikedReports] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      await fetchCommunities();
      setInitialLoading(false);
    };
    load();
  }, []);

  const filteredCommunities = communities.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createCommunity(newName.trim(), newDesc.trim());
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !showEditModal) return;
    setEditSaving(true);
    try {
      await updateCommunity(showEditModal._id || showEditModal.id, { name: editName.trim(), description: editDesc.trim() });
      setShowEditModal(null);
    } catch {
    } finally {
      setEditSaving(false);
    }
  };

  const isMember = (community) =>
    community.members?.some(m => (m._id || m.id) === (user?._id || user?.id));

  const memberCount = (community) => community.members?.length || 0;

  if (initialLoading) {
    return (
      <div className="space-y-10 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600" />
            Community Hub
          </h1>
          <p className="text-slate-500 text-sm font-semibold">Create and join communities focused on environmental action</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create Community
        </button>
      </div>

      {/* Search + Communities Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Compass className="h-5 w-5 text-emerald-600" />
            All Communities
            <span className="text-xs font-semibold text-slate-400 ml-1">({communities.length})</span>
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-600">
              {searchQuery ? 'No communities match your search' : 'No communities yet'}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {searchQuery ? 'Try a different search term.' : 'Be the first to create a community!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => {
              const joined = isMember(community);
              const isOwner = (community.createdBy?._id || community.createdBy?.id) === (user?._id || user?.id);
              return (
                <div
                  key={community._id || community.id}
                  onClick={() => navigate(`/citizen-dashboard/community/${community._id || community.id}`)}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-extrabold text-slate-800 text-[15px]">{community.name}</h4>
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditName(community.name);
                            setEditDesc(community.description || '');
                            setShowEditModal(community);
                          }}
                          className="p-1 text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {community.description && (
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">
                        {community.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {community.createdBy?.avatar ? (
                          <img src={community.createdBy.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold truncate">
                        Created by {community.createdBy?.fullName || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <span className="text-[11px] text-slate-600 font-semibold">
                      {memberCount(community)} {memberCount(community) === 1 ? 'member' : 'members'}
                    </span>
                    {isOwner ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm('Delete this community permanently? All posts and replies will be removed.');
                          if (!ok) return;
                          try {
                            await deleteCommunity(community._id || community.id);
                          } catch {}
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (joined) {
                              await leaveCommunity(community._id || community.id);
                            } else {
                              await joinCommunity(community._id || community.id);
                            }
                          } catch {}
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          joined
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {joined ? 'Joined' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trending Reports & Knowledge Base */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Trending Local Alerts
          </h3>
          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400 font-semibold">No recent reports.</p>
            ) : (
              reports.slice(0, 3).map((report) => {
                const isLiked = likedReports.includes(report.id || report._id);
                return (
                  <div key={report.id || report._id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{report.title}</h4>
                      <p className="text-xs text-slate-500 truncate font-semibold">{report.location}</p>
                      <StatusBadge status={report.status} />
                    </div>
                    <button
                      onClick={() => setLikedReports(prev =>
                        prev.includes(report.id || report._id)
                          ? prev.filter(id => id !== (report.id || report._id))
                          : [...prev, report.id || report._id]
                      )}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        isLiked
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" fill={isLiked ? 'currentColor' : 'none'} />
                      <span>{isLiked ? 'Helpful' : 'Upvote'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Knowledge Base */}
        <section className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-600 animate-pulse" />
            Eco Knowledge Base
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {ecoArticles.map((art, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Knowledge Base</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base">{art.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">{art.desc}</p>
                </div>
                <button
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(art.title + ' environmental')}`, '_blank')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-500 self-start pt-4 cursor-pointer"
                >
                  Read Article →
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full max-w-md pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900">Create a Community</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Community Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Lagos Clean Water Initiative"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
                    <textarea
                      rows={3}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What is this community about?"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Community'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Community Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowEditModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full max-w-md pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Community</h3>
                  <button onClick={() => setShowEditModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleEdit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Community Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
                    <textarea
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={editSaving || !editName.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog />
    </motion.div>
  );
}
