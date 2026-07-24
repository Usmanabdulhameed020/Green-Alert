import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Trash2,
  CheckCircle,
  FileText,
  AlertTriangle,
  Info,
  Search,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import EmptyState from '../../components/ui/EmptyState';

// Relative Time Helper
function getRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useCitizen();

  const { permission, requestPermission } = useNotifications();
  const { success } = useToast();

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      success('Browser notifications enabled!');
    }
  };

  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Unread' | 'Read'
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const ITEMS_PER_PAGE = 20;

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleMarkRead = (notifId, isAlreadyRead) => {
    if (!isAlreadyRead) {
      markAsRead(notifId);
    }
  };

  // Filters
  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'Unread') {
      matchesTab = !n.isRead;
    } else if (activeTab === 'Read') {
      matchesTab = n.isRead;
    }

    return matchesSearch && matchesTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Paginated subset for display (newest first)
  const paginatedNotifications = filteredNotifications.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNotifications.length;

  // Group notifications (using paginated subset)
  const getGroupedNotifications = () => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const todayStr = now.toDateString();

    const yest = new Date();
    yest.setDate(now.getDate() - 1);
    const yestStr = yest.toDateString();

    paginatedNotifications.forEach((n) => {
      const date = new Date(n.createdAt);
      const dateStr = date.toDateString();

      if (dateStr === todayStr) {
        today.push(n);
      } else if (dateStr === yestStr) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = getGroupedNotifications();

  const getNotifIcon = (type) => {
    switch (type) {
      case 'report_status': return { icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'alert': return { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' };
      default: return { icon: Info, color: 'text-slate-500 bg-slate-50 border-slate-100' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12 max-w-4xl mx-auto"
    >
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Notifications
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm font-semibold">Track updates about incident triage routing logs</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5 self-start sm:self-center"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Mark all read
          </button>
        )}
      </div>

      {/* Enable Browser Notifications Banner */}
      {permission === 'default' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Bell className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Enable browser notifications</p>
              <p className="text-xs text-emerald-700 font-medium">Get alerted instantly when new updates arrive.</p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm self-start sm:self-center"
          >
            Enable
          </button>
        </motion.div>
      )}

      {/* Control filters bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Filters */}
        <div className="flex gap-2">
          {['All', 'Unread', 'Read'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <EmptyState
            icon={Bell}
            title={searchQuery ? 'No matching alerts' : 'Your inbox is clear!'}
            description={searchQuery ? 'Try clearing your search filters to view notifications.' : 'You have no environmental updates or messages at the moment.'}
            actionLabel={searchQuery ? 'Clear search' : null}
            onAction={searchQuery ? () => setSearchQuery('') : null}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {[
              { label: 'Today', list: today },
              { label: 'Yesterday', list: yesterday },
              { label: 'Earlier', list: earlier },
            ].map(
              (group) =>
                group.list.length > 0 && (
                  <div key={group.label} className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
                      {group.label}
                    </h3>
                    <div className="space-y-2.5">
                      {group.list.map((notif) => {
                        const { icon: NotifIcon, color } = getNotifIcon(notif.type);
                        return (
                          <motion.div
                            key={notif.id || notif._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleMarkRead(notif.id || notif._id, notif.isRead)}
                            className={`p-4 bg-white border rounded-2xl transition-all shadow-sm flex items-start gap-4 cursor-pointer group ${
                              notif.isRead ? 'border-slate-200' : 'border-emerald-200 bg-emerald-50/20'
                            }`}
                          >
                            {/* Icon Indicator */}
                            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${color}`}>
                              <NotifIcon className="h-5 w-5" />
                            </div>

                            {/* Message content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-start justify-between gap-4">
                                <h4 className={`text-sm text-slate-800 truncate leading-snug ${
                                  notif.isRead ? 'font-semibold' : 'font-extrabold text-slate-900'
                                }`}>
                                  {notif.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                                  {getRelativeTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {notif.message}
                              </p>
                            </div>

                            {/* Unread dot & Delete */}
                            <div className="flex items-center gap-3.5 self-center">
                              {!notif.isRead && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id || notif._id);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete Notification"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )
            )}
          </AnimatePresence>
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            className="px-6 py-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            Load More ({filteredNotifications.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </motion.div>
  );
}
