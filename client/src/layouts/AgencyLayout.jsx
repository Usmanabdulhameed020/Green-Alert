import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ClipboardList, Settings, LogOut, Menu,
  Bell, CheckCheck, Trash2, BarChart3, Download, Smartphone, X,
} from 'lucide-react';
import { useCitizen } from '../contexts/CitizenContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../contexts/NotificationContext';
import usePWAInstall from '../hooks/usePWAInstall';
import logo from '../assets/GreenAlert Logo.png';
import AnnouncementBanner from '../components/ui/AnnouncementBanner';
import axios from 'axios';

const navItems = [
  { to: '/agency', icon: Building2, label: 'Dashboard', end: true },
  { to: '/agency/reports', icon: ClipboardList, label: 'Assigned Reports' },
  { to: '/agency/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/agency/settings', icon: Settings, label: 'Settings' },
];

export default function AgencyLayout() {
  const { user, logout, token } = useCitizen();
  const { on } = useSocket();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() =>
    localStorage.getItem('ga_install_banner_dismissed') === 'true'
  );

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setInstallBannerDismissed(true);
  };

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    localStorage.setItem('ga_install_banner_dismissed', 'true');
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/v1/notifications', { headers });
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token, fetchNotifications]);

  useEffect(() => {
    if (!on) return;
    const off = on('notification:new', (notif) => {
      setNotifications((prev) => {
        if (prev.some((n) => (n._id || n.id) === (notif._id || notif.id))) return prev;
        return [notif, ...prev];
      });
      sendNotification(notif.title || 'New Notification', {
        body: notif.message || '',
      });
    });
    return () => off();
  }, [on, sendNotification]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notif) => {
    try {
      await axios.patch(`/api/v1/notifications/${notif._id || notif.id}/read`, {}, { headers });
      setNotifications((prev) => prev.map((n) => (n._id === notif._id || n.id === notif.id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => axios.patch(`/api/v1/notifications/${n._id || n.id}/read`, {}, { headers }).catch(() => {})));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotif = async (notif) => {
    try {
      await axios.delete(`/api/v1/notifications/${notif._id || notif.id}`, { headers });
      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== (notif._id || notif.id)));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:relative top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="GreenAlert logo" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-extrabold text-slate-900">GreenAlert</h1>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Agency Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="GreenAlert logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName || user?.name || 'Agency'}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Organization</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen((p) => !p)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-96 flex flex-col"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                      <h3 className="text-xs font-extrabold text-slate-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer">
                          <CheckCheck className="h-3 w-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? notifications.slice(0, 20).map((notif) => (
                        <div key={notif._id || notif.id}
                          className={`px-4 py-3 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-amber-50/40' : ''}`}
                          onClick={() => { markAsRead(notif); setNotifOpen(false); }}
                        >
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-amber-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{new Date(notif.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteNotif(notif); }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )) : (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">No notifications yet.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-xs font-semibold text-slate-500">{user?.fullName || user?.name || 'Agency'}</span>
            <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="GreenAlert logo" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        <AnnouncementBanner theme="agency" />

        {/* Mobile PWA Install Banner */}
        <AnimatePresence>
          {isInstallable && !isInstalled && !installBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mx-4 mt-3 flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-lg"
            >
              <Smartphone className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">Install GreenAlert</p>
                <p className="text-xs text-blue-100 truncate">Add to home screen for the best experience</p>
              </div>
              <button onClick={handleInstall} className="shrink-0 px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">Install</button>
              <button onClick={dismissInstallBanner} aria-label="Dismiss" className="shrink-0 p-1 text-blue-100 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
