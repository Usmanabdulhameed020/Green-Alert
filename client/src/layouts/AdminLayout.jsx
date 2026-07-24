import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Users, Building2,
  Settings, LogOut, Menu, X, ChevronDown, Bell,
} from 'lucide-react';
import { useCitizen } from '../contexts/CitizenContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../contexts/NotificationContext';
import logo from '../assets/GreenAlert Logo.png';
import AnnouncementBanner from '../components/ui/AnnouncementBanner';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/reports', icon: ClipboardList, label: 'Reports' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/organizations', icon: Building2, label: 'Organizations' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useCitizen();
  const { on } = useSocket();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Listen for real-time notifications via socket
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="GreenAlert logo" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight">GreenAlert</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
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
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <img src={logo} alt="GreenAlert logo" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <Bell className="h-5 w-5 text-slate-400" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500">{user?.fullName || 'Admin'}</span>
            <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <img src={logo} alt="GreenAlert logo" className="h-full w-full object-cover" />
              )}
            </div>
          </div>
        </header>

        <AnnouncementBanner theme="admin" />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
