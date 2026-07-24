import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  User,
  MessageSquare,
  Send,
  Trash2,
  Calendar,
  MoreHorizontal,
  Pencil,
  X,
  Check,
  Plus,
  ThumbsUp,
  Heart,
  Flame,
  BarChart3,
  Scale,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useConfirm } from '../../components/ui/ConfirmModal';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const TAG_OPTIONS = ['Alert', 'Cleanup', 'Discussion', 'Event', 'Question'];
const REACTION_ICONS = { like: ThumbsUp, heart: Heart, fire: Flame };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function getTotalVotes(options) {
  return options.reduce((s, o) => s + (o.voters?.length || 0), 0);
}

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, communities, joinCommunity, leaveCommunity, deleteCommunity, updateCommunity, polls, fetchPolls, createPoll, votePoll } = useCitizen();
  const { confirm, ConfirmDialog } = useConfirm();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTag, setActiveTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [postDropdown, setPostDropdown] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollCreating, setPollCreating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [communityRes, postsRes] = await Promise.all([
          axios.get(`/api/communities/${id}`).then(r => {
            setCommunity(r.data);
            return r.data;
          }).catch(async () => {
            const all = await axios.get('/api/communities');
            const found = all.data.find(c => (c._id || c.id) === id);
            if (found) setCommunity(found);
          }),
          axios.get(`/api/posts/community/${id}`).then(r => {
            if (Array.isArray(r.data)) setPosts(r.data);
          }).catch(() => {}),
        ]);
      } catch (err) {
        console.error('Failed to load community:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchPolls(id);
  }, [id]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPostDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/posts/community/${id}`, { content: newPost.trim(), tags: selectedTags });
      setPosts(prev => [res.data, ...prev]);
      setNewPost('');
      setSelectedTags([]);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const ok = await confirm('Delete this post?');
    if (!ok) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleEditPost = async (postId) => {
    if (!editingPostContent.trim()) return;
    try {
      const res = await axios.patch(`/api/posts/${postId}`, { content: editingPostContent.trim() });
      setPosts(prev => prev.map(p => (p._id || p.id) === postId ? res.data : p));
      setEditingPostId(null);
      setEditingPostContent('');
    } catch (err) {
      console.error('Failed to edit post:', err);
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id || post.id);
    setEditingPostContent(post.content);
    setPostDropdown(null);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditingPostContent('');
  };

  const handleReact = async (postId, type) => {
    try {
      const res = await axios.post(`/api/posts/${postId}/react`, { type });
      setPosts(prev => prev.map(p => (p._id || p.id) === postId ? res.data : p));
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleEditReply = async (replyId, postId) => {
    if (!editingReplyContent.trim()) return;
    try {
      const res = await axios.patch(`/api/replies/${replyId}`, { content: editingReplyContent.trim() });
      setReplies(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(r => (r._id || r.id) === replyId ? res.data : r),
      }));
      setEditingReplyId(null);
      setEditingReplyContent('');
    } catch (err) {
      console.error('Failed to edit reply:', err);
    }
  };

  const startEditReply = (reply) => {
    setEditingReplyId(reply._id || reply.id);
    setEditingReplyContent(reply.content);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyContent('');
  };

  const toggleReplies = async (postId) => {
    if (expandedReplies[postId]) {
      setExpandedReplies(prev => ({ ...prev, [postId]: false }));
      return;
    }
    setExpandedReplies(prev => ({ ...prev, [postId]: true }));
    if (!replies[postId]) {
      try {
        const res = await axios.get(`/api/replies/post/${postId}`);
        setReplies(prev => ({ ...prev, [postId]: Array.isArray(res.data) ? res.data : [] }));
      } catch {
        setReplies(prev => ({ ...prev, [postId]: [] }));
      }
    }
  };

  const handleReply = async (postId) => {
    const text = replyText[postId]?.trim();
    if (!text) return;
    setReplyLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(`/api/replies/post/${postId}`, { content: text });
      setReplies(prev => ({ ...prev, [postId]: [...(prev[postId] || []), res.data] }));
      setReplyText(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Failed to create reply:', err);
    } finally {
      setReplyLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteReply = async (replyId, postId) => {
    const ok = await confirm('Delete this reply?');
    if (!ok) return;
    try {
      await axios.delete(`/api/replies/${replyId}`);
      setReplies(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(r => (r._id || r.id) !== replyId) }));
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const handleEditCommunity = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await updateCommunity(id, { name: editName.trim(), description: editDesc.trim(), rules: editRules.filter(r => r.trim()) });
      if (res) setCommunity(res);
      setShowEditModal(false);
    } catch {
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) return;
    setPollCreating(true);
    try {
      await createPoll(id, pollQuestion.trim(), validOptions.map(o => ({ text: o.trim() })));
      setShowCreatePoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch {
    } finally {
      setPollCreating(false);
    }
  };

  const handleVote = async (pollId, idx) => {
    try {
      await votePoll(pollId, idx);
    } catch {}
  };

  const filterByTag = async (tag) => {
    setActiveTag(tag === activeTag ? '' : tag);
    try {
      const res = await axios.get(`/api/posts/community/${id}${tag && tag !== activeTag ? `?tag=${tag}` : ''}`);
      if (Array.isArray(res.data)) setPosts(res.data);
    } catch {}
  };

  const isMember = () =>
    community?.members?.some(m => (m._id || m.id) === (user?._id || user?.id));

  const isOwner = () =>
    (community?.createdBy?._id || community?.createdBy?.id) === (user?._id || user?.id);

  const openEditModal = () => {
    setEditName(community.name);
    setEditDesc(community.description || '');
    setEditRules(community.rules?.length ? [...community.rules] : ['']);
    setShowEditModal(true);
  };

  const addRuleField = () => setEditRules(prev => [...prev, '']);
  const removeRuleField = (idx) => setEditRules(prev => prev.filter((_, i) => i !== idx));

  if (loading) return <LoadingSkeleton type="profile" count={3} />;
  if (!community) return (
    <div className="text-center py-20">
      <p className="font-bold text-slate-600">Community not found</p>
      <button onClick={() => navigate('/citizen-dashboard/community')} className="mt-4 text-sm text-emerald-600 font-semibold cursor-pointer">Back to Communities</button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/citizen-dashboard/community')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Communities
        </button>
        <div className="flex items-center gap-2">
          {isOwner() && (
            <>
              <button onClick={openEditModal} className="text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm('Delete this community permanently? All posts, polls, and replies will be removed.');
                  if (!ok) return;
                  try {
                    await deleteCommunity(id);
                    navigate('/citizen-dashboard/community');
                  } catch {}
                }}
                className="text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              >
                Delete
              </button>
            </>
          )}
          {!isOwner() && (
            <button
              onClick={async () => {
                try {
                  if (isMember()) await leaveCommunity(id);
                  else await joinCommunity(id);
                } catch {}
              }}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                isMember()
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isMember() ? 'Joined' : 'Join Community'}
            </button>
          )}
        </div>
      </div>

      {/* Community Info */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">{community.name}</h1>
        {community.description && (
          <p className="text-sm text-slate-500 font-semibold mt-2 leading-relaxed">{community.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500 font-semibold">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-slate-400" />
            Created by {community.createdBy?.fullName || 'Unknown'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            Created {timeAgo(community.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            {community.members?.length || 0} {(community.members?.length || 0) === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* Rules Section */}
      {community.rules?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <button
            onClick={() => setRulesOpen(!rulesOpen)}
            className="flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer w-full text-left"
          >
            <Scale className="h-4.5 w-4.5 text-emerald-600" />
            Community Rules
            <ChevronRight size={16} className={`ml-auto text-slate-400 transition-transform ${rulesOpen ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {rulesOpen && (
              <motion.ol
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {community.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-semibold">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Members Row */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-emerald-600" />
          Members ({community.members?.length || 0})
        </h3>
        <div className="flex flex-wrap gap-3">
          {community.members?.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold">No members yet</p>
          ) : (
            community.members?.map((member) => (
              <div key={member._id || member.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-3.5 w-3.5 text-emerald-600" />}
                </div>
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{member.fullName || 'Unknown'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Post */}
      {isMember() && (
        <form onSubmit={handlePost} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
              Create a Post
            </h3>
          </div>
          <textarea
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something with the community..."
            maxLength={2000}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none resize-none"
          />
          {/* Tag selector */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags:</span>
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedTags.includes(tag)
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-slate-400 font-semibold">{newPost.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !newPost.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {/* Polls Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
            Polls
          </h3>
          {isMember() && (
            <button
              onClick={() => setShowCreatePoll(true)}
              className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              New Poll
            </button>
          )}
        </div>
        {polls.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold text-center py-4">No polls yet</p>
        ) : (
          <div className="space-y-4">
            {polls.map(poll => {
              const totalVotes = getTotalVotes(poll.options);
              const userVoted = poll.options.some(o => o.voters?.some(v => (v._id || v) === (user?._id || user?.id)));
              return (
                <div key={poll._id || poll.id} className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-bold text-sm text-slate-800">{poll.question}</p>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap ml-2">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                  </div>
                  <div className="space-y-2">
                    {poll.options.map((opt, idx) => {
                      const voteCount = opt.voters?.length || 0;
                      const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={idx}
                          disabled={userVoted}
                          onClick={() => handleVote(poll._id || poll.id, idx)}
                          className="w-full text-left relative overflow-hidden rounded-xl border border-slate-200 px-4 py-2.5 transition-all cursor-pointer disabled:cursor-default group"
                        >
                          <div
                            className="absolute inset-0 bg-emerald-50 transition-all"
                            style={{ width: userVoted ? `${pct}%` : '0%' }}
                          />
                          <div className="relative flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{opt.text}</span>
                            <span className="font-bold text-slate-500">{userVoted ? `${pct}%` : ''}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {!userVoted && isMember() && (
                    <p className="text-[10px] text-slate-400 font-semibold mt-2">Click an option to vote</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tags Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
        <button
          onClick={() => filterByTag('')}
          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            !activeTag ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {TAG_OPTIONS.map(tag => (
          <button
            key={tag}
            onClick={() => filterByTag(tag)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTag === tag ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
          Posts ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500 text-sm">No posts yet</p>
            {isMember() && <p className="text-xs text-slate-400 mt-1">Be the first to post!</p>}
          </div>
        ) : (
          posts.map((post) => {
            const postId = post._id || post.id;
            const isAuthor = (post.author?._id || post.author?.id) === (user?._id || user?.id);
            const postReplies = replies[postId] || [];
            const isExpanded = expandedReplies[postId];
            const isEditing = editingPostId === postId;
            const userReaction = post.reactions?.find(r => (r.user?._id || r.user) === (user?._id || user?.id));
            const counts = { like: 0, heart: 0, fire: 0 };
            post.reactions?.forEach(r => { counts[r.type]++; });
            return (
              <div key={postId} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {post.author?.avatar ? <img src={post.author.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{post.author?.fullName || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.tags?.map(tag => (
                      <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{tag}</span>
                    ))}
                    {isAuthor && !isEditing && (
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() => setPostDropdown(postDropdown === postId ? null : postId)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {postDropdown === postId && (
                          <div className="absolute right-0 top-8 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                            <button onClick={() => startEditPost(post)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                              <Pencil className="h-3.5 w-3.5 text-slate-400" />
                              Edit
                            </button>
                            <button onClick={() => { setPostDropdown(null); handleDeletePost(postId); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={editingPostContent}
                      onChange={(e) => setEditingPostContent(e.target.value)}
                      maxLength={2000}
                      className="w-full bg-slate-50 border border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={cancelEditPost} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Cancel</button>
                      <button onClick={() => handleEditPost(postId)} disabled={!editingPostContent.trim()} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-700 font-semibold leading-relaxed whitespace-pre-wrap">{post.content}</p>
                )}

                {/* Reactions */}
                {!isEditing && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    {Object.entries(REACTION_ICONS).map(([type, Icon]) => {
                      const active = userReaction?.type === type;
                      return (
                        <button
                          key={type}
                          onClick={() => handleReact(postId, type)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${active ? 'fill-emerald-600' : ''}`} />
                          <span>{counts[type] || 0}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => toggleReplies(postId)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {postReplies.length > 0 ? postReplies.length : 'Reply'}
                    </button>
                  </div>
                )}

                {/* Replies */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 pt-2">
                    {postReplies.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold px-2">No replies yet</p>
                    ) : (
                      postReplies.map((reply) => {
                        const replyId = reply._id || reply.id;
                        const isReplyAuthor = (reply.author?._id || reply.author?.id) === (user?._id || user?.id);
                        const isEditingReply = editingReplyId === replyId;
                        return (
                          <div key={replyId} className="flex items-start gap-2.5 pl-2 group">
                            <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                              {reply.author?.avatar ? <img src={reply.author.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-3 w-3 text-emerald-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">{reply.author?.fullName || 'Unknown'}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(reply.createdAt)}</span>
                                {isReplyAuthor && !isEditingReply && (
                                  <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditReply(reply)} className="p-0.5 text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"><Pencil className="h-3 w-3" /></button>
                                    <button onClick={() => handleDeleteReply(replyId, postId)} className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                )}
                              </div>
                              {isEditingReply ? (
                                <div className="mt-1.5 space-y-2">
                                  <input type="text" value={editingReplyContent} onChange={(e) => setEditingReplyContent(e.target.value)} className="w-full bg-slate-50 border border-emerald-500 focus:bg-white rounded-lg py-1.5 px-3 text-xs font-semibold outline-none" autoFocus />
                                  <div className="flex gap-2">
                                    <button onClick={cancelEditReply} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
                                    <button onClick={() => handleEditReply(replyId, postId)} disabled={!editingReplyContent.trim()} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer disabled:opacity-50">Save</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-600 font-semibold mt-0.5 leading-relaxed">{reply.content}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {isMember() && (
                      <div className="flex items-start gap-2.5 pt-2 pl-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-3 w-3 text-emerald-600" />}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={replyText[postId] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [postId]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(postId); } }}
                            placeholder="Write a reply..."
                            className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 px-3 text-xs font-semibold outline-none"
                          />
                          <button
                            onClick={() => handleReply(postId)}
                            disabled={replyLoading[postId] || !replyText[postId]?.trim()}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Community Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowEditModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full max-w-lg pointer-events-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Community</h3>
                  <button onClick={() => setShowEditModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleEditCommunity} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Community Name</label>
                    <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
                    <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Rules</label>
                    {editRules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] font-bold text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => setEditRules(prev => prev.map((r, i) => i === idx ? e.target.value : r))}
                          placeholder="e.g. Be respectful to others"
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg py-1.5 px-3 text-xs font-semibold outline-none"
                        />
                        <button type="button" onClick={() => removeRuleField(idx)} className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addRuleField} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer">
                      <Plus className="h-3 w-3" /> Add Rule
                    </button>
                  </div>
                  <button type="submit" disabled={editSaving || !editName.trim()} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreatePoll && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCreatePoll(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full max-w-md pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-slate-900">Create a Poll</h3>
                  <button onClick={() => setShowCreatePoll(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreatePoll} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Question</label>
                    <input type="text" required value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="What would you like to ask?" className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-sm font-semibold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Options (2-5)</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required={idx < 2}
                          value={opt}
                          onChange={(e) => setPollOptions(prev => prev.map((o, i) => i === idx ? e.target.value : o))}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg py-2 px-3 text-xs font-semibold outline-none"
                        />
                        {idx >= 2 && (
                          <button type="button" onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button type="button" onClick={() => setPollOptions(prev => [...prev, ''])} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer">
                        <Plus className="h-3 w-3" /> Add Option
                      </button>
                    )}
                  </div>
                  <button type="submit" disabled={pollCreating || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    {pollCreating ? 'Creating...' : 'Create Poll'}
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
