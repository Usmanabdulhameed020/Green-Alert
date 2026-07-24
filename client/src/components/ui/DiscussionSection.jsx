import React, { useState, useEffect, useRef } from 'react';
import { Send, CornerDownRight, MessageSquare, Reply } from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';

export default function DiscussionSection({ reportId }) {
  const { user, token } = useCitizen();
  const { on, socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState({}); // mapped by commentId -> text
  const [activeReplyId, setActiveReplyId] = useState(null); // commentId currently replying to
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReply, setSubmittingReply] = useState({}); // mapped by commentId -> boolean
  const commentsEndRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/v1/reports/${reportId}/comments`, { headers });
      setComments(data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  // Socket connection for real-time comments & replies
  useEffect(() => {
    if (!on || !socket) return;
    
    // Join report room
    socket.emit('join-report', reportId);

    const offComment = on('report:comment-added', (data) => {
      if (data.reportId === reportId) {
        setComments((prev) => {
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          return [...prev, data.comment];
        });
      }
    });

    const offReply = on('report:reply-added', (data) => {
      if (data.reportId === reportId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === data.commentId) {
              if (c.replies.some((r) => r._id === data.reply._id)) return c;
              return { ...c, replies: [...c.replies, data.reply] };
            }
            return c;
          })
        );
      }
    });

    return () => {
      socket.emit('leave-report', reportId);
      offComment();
      offReply();
    };
  }, [on, socket, reportId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const { data } = await axios.post(`/api/v1/reports/${reportId}/comments`, { text: commentText }, { headers });
      setComments((prev) => {
        if (prev.some((c) => c._id === data._id)) return prev;
        return [...prev, data];
      });
      setCommentText('');
      // Scroll to bottom
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId) => {
    const text = replyText[commentId];
    if (!text || !text.trim() || submittingReply[commentId]) return;

    setSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
    try {
      const { data } = await axios.post(
        `/api/v1/reports/${reportId}/comments/${commentId}/replies`,
        { text },
        { headers }
      );
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            if (c.replies.some((r) => r._id === data._id)) return c;
            return { ...c, replies: [...c.replies, data] };
          }
          return c;
        })
      );
      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'agency':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200/60';
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading discussions...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm flex flex-col space-y-6">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-emerald-600" />
        Discussion Feed
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleCommentSubmit} className="relative">
        <textarea
          rows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Ask for updates or add a comment..."
          className="w-full bg-slate-50 border border-slate-200/60 focus:border-emerald-500 focus:bg-white rounded-2xl py-3 pl-4 pr-12 text-sm font-semibold outline-none resize-none transition-all"
        />
        <button
          type="submit"
          disabled={submittingComment || !commentText.trim()}
          className="absolute right-3.5 top-3.5 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400 font-semibold">
            No comments logged yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="space-y-3">
              {/* Top Level Comment */}
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold select-none">
                      {comment.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                      {comment.user?.fullName || 'User'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.25 rounded border ${getRoleBadge(comment.user?.role)}`}>
                      {comment.user?.role || 'Citizen'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {comment.text}
                </p>

                {/* Reply action button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold transition-all cursor-pointer"
                  >
                    <Reply className="h-3 w-3" /> Reply
                  </button>
                </div>
              </div>

              {/* Nested Replies */}
              <div className="pl-6 space-y-2">
                {comment.replies &&
                  comment.replies.map((reply) => (
                    <div key={reply._id} className="p-3 bg-white border border-slate-100 rounded-2xl space-y-1 flex items-start gap-2.5">
                      <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-1" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5.5 h-5.5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[9px] font-bold select-none">
                              {reply.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-[11px] font-bold text-slate-800 truncate max-w-[100px]">
                              {reply.user?.fullName || 'User'}
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.25 rounded border ${getRoleBadge(reply.user?.role)}`}>
                              {reply.user?.role || 'Citizen'}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-400 font-semibold">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {reply.text}
                        </p>
                      </div>
                    </div>
                  ))}

                {/* Inline Reply Input */}
                {activeReplyId === comment._id && (
                  <div className="p-3 bg-white border border-dashed border-slate-200/50 rounded-2xl flex items-start gap-2.5">
                    <CornerDownRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-1" />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={replyText[comment._id] || ''}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [comment._id]: e.target.value }))
                        }
                        placeholder="Write a reply..."
                        className="w-full bg-slate-50 border border-slate-200/60 focus:border-emerald-500 focus:bg-white rounded-xl py-2 pl-3 pr-10 text-xs font-semibold outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleReplySubmit(comment._id);
                        }}
                      />
                      <button
                        onClick={() => handleReplySubmit(comment._id)}
                        disabled={submittingReply[comment._id] || !replyText[comment._id]?.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-all cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
}
