import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Search,
  Map,
  Bell,
  Users,
  Bookmark,
  Award,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wrench,
  Download,
  Smartphone,
} from 'lucide-react';
import { useCitizen } from '../contexts/CitizenContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../contexts/NotificationContext';
import useMaintenance from '../hooks/useMaintenance';
import usePWAInstall from '../hooks/usePWAInstall';
import AnnouncementBanner from '../components/ui/AnnouncementBanner';
import logo from '../assets/GreenAlert Logo.png';

const navItems = [
  { label: 'Dashboard', path: '/citizen-dashboard', icon: LayoutDashboard },
  { label: 'My Reports', path: '/citizen-dashboard/my-reports', icon: FileText },
  { label: 'Create Report', path: '/citizen-dashboard/create-report', icon: PlusCircle },
  { label: 'Explore Reports', path: '/citizen-dashboard/explore', icon: Search },
  { label: 'Interactive Map', path: '/citizen-dashboard/map', icon: Map },
  { label: 'Notifications', path: '/citizen-dashboard/notifications', icon: Bell, isNotifications: true },
  { label: 'Community', path: '/citizen-dashboard/community', icon: Users },
  { label: 'Saved Reports', path: '/citizen-dashboard/saved', icon: Bookmark },
  { label: 'Achievements', path: '/citizen-dashboard/achievements', icon: Award },
  { label: 'Profile', path: '/citizen-dashboard/profile', icon: User },
  { label: 'Settings', path: '/citizen-dashboard/settings', icon: Settings },
];

const mobileNavItems = [
  { label: 'Dashboard', path: '/citizen-dashboard', icon: LayoutDashboard },
  { label: 'Reports', path: '/citizen-dashboard/my-reports', icon: FileText },
  { label: 'Create', path: '/citizen-dashboard/create-report', icon: PlusCircle, isCreate: true },
  { label: 'Community', path: '/citizen-dashboard/community', icon: Users },
  { label: 'Map', path: '/citizen-dashboard/map', icon: Map },
  { label: 'Notifications', path: '/citizen-dashboard/notifications', icon: Bell, isNotif: true },
];

export default function DashboardLayout() {
  const { user: contextUser, notifications, logout, addNotificationFromSocket } = useCitizen();
  const { on } = useSocket();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() =>
    localStorage.getItem('ga_install_banner_dismissed') === 'true'
  );

  // Fallback to localStorage for user data to handle first-load timing after login
  const user = React.useMemo(() => {
    if (contextUser) return contextUser;
    try {
      const savedUser = localStorage.getItem('greenalert_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  }, [contextUser]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setInstallBannerDismissed(true);
  };

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    localStorage.setItem('ga_install_banner_dismissed', 'true');
  };

  // Close mobile menu and profile dropdown on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    const off = on('notification:new', (notif) => {
      addNotificationFromSocket(notif);
      sendNotification(notif.title || 'New Notification', {
        body: notif.message || '',
      });
    });
    return off;
  }, [on, addNotificationFromSocket, sendNotification]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = () => {
    if (!user?.fullName) return 'C';
    return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isPathActive = (path) => {
    if (path === '/citizen-dashboard') {
      return location.pathname === '/citizen-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 antialiased selection:bg-emerald-500/20">
      {/* Desktop Sidebar */}
      <aside className="no-print w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-30">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/citizen-dashboard" className="flex items-center gap-2.5 group">
            <img src={logo} alt="GreenAlert logo" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-emerald-500/10 transition-transform group-hover:scale-102" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Green<span className="text-emerald-600">Alert</span>
            </span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const active = isPathActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[14px]">{item.label}</span>
                </div>
                {item.isNotifications && unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3 p-2">
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden bg-emerald-700 text-white flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-slate-800">{user?.fullName || 'Citizen User'}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{user?.role || 'Citizen'}</p>
            </div>
          </div>
          {/* PWA Install Button — sidebar desktop */}
          {isInstallable && !isInstalled && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded-xl transition-all cursor-pointer mb-2 group"
            >
              <Download className="h-4 w-4 text-emerald-500 group-hover:text-white" />
              Install App
            </button>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 text-slate-400 group-hover:text-rose-500" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen pb-20 lg:pb-0">
        {/* Top Navbar */}
        <header className="no-print bg-white border-b border-slate-200 h-18 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-slate-100/40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Open Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 hidden sm:block">
              {getGreeting()}, <span className="text-emerald-700">{user?.fullName?.split(' ')[0] || 'Citizen'}</span> 👋
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="relative w-48 sm:w-64 max-w-xs">
              <input
                type="text"
                placeholder="Search reports..."
                onClick={() => navigate('/citizen-dashboard/explore')}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none transition-all cursor-pointer"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            {/* Notification Bell */}
            <Link to="/citizen-dashboard/notifications" className="relative p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell className="h-5.5 w-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs select-none overflow-hidden bg-emerald-700 text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-20 origin-top-right overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/citizen-dashboard/profile');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/citizen-dashboard/settings');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        Settings
                      </button>
                      <hr className="border-slate-100 my-1" />
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                      >
                        <LogOut className="h-4 w-4 text-rose-400" />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Global Announcement Banner */}
        <AnnouncementBanner theme="citizen" />

        {/* Mobile PWA Install Banner */}
        <AnimatePresence>
          {isInstallable && !isInstalled && !installBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mx-4 mt-3 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg"
            >
              <Smartphone className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">Install GreenAlert</p>
                <p className="text-xs text-emerald-100 truncate">Add to home screen for the best experience</p>
              </div>
              <button
                onClick={handleInstall}
                className="shrink-0 px-3 py-1.5 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                Install
              </button>
              <button
                onClick={dismissInstallBanner}
                aria-label="Dismiss install banner"
                className="shrink-0 p-1 text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation (Sidebar on mobile) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden no-print"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-80 bg-white border-r border-slate-200 z-50 flex flex-col lg:hidden no-print"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="GreenAlert logo" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-emerald-500/10" />
                  <span className="text-xl font-bold tracking-tight text-slate-900">GreenAlert</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => {
                  const active = isPathActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(item.path);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-[14px]">{item.label}</span>
                      </div>
                      {item.isNotifications && unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t bg-slate-50 space-y-2">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Log Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar (Bottom Nav) */}
      <nav className="no-print fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 lg:hidden flex justify-around items-center px-2 z-30 shadow-lg">
        {mobileNavItems.map((item) => {
          const active = isPathActive(item.path);
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25 active:scale-95 transition-all -translate-y-4 border-4 border-white cursor-pointer"
                aria-label="Create Report"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer relative ${
                active ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              <Icon className="h-5.5 w-5.5" />
              <span className="text-[10px] mt-1 font-semibold">{item.label}</span>
              {item.isNotif && unreadCount > 0 && (
                <span className="absolute top-0 right-1/4 w-4 h-4 bg-emerald-600 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
