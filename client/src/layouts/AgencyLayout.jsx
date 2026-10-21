import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Building2, ClipboardList, Settings, LogOut, Menu } from 'lucide-react';
import { useCitizen } from '../contexts/CitizenContext';
import { useModal } from '../contexts/ModalContext';
import logo from '../assets/GreenAlert Logo.png';

const navItems = [
  { to: '/agency', icon: Building2, label: 'Dashboard', end: true },
  { to: '/agency/reports', icon: ClipboardList, label: 'Assigned Reports' },
  { to: '/agency/settings', icon: Settings, label: 'Settings' },
];

export default function AgencyLayout() {
  const { user, logout } = useCitizen();
  const { confirm: modalConfirm } = useModal();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const ok = await modalConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of the Agency portal?',
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In',
      type: 'warning',
    });
    if (!ok) return;
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
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-500 hover:bg-slate-100 rounded-xl cursor-pointer">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-semibold text-slate-500">{user?.fullName || user?.name || 'Agency'}</span>
            <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="GreenAlert logo" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
