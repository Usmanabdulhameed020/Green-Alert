import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';

const THEMES = {
  citizen: {
    bg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white',
    badge: 'bg-emerald-950/30 text-emerald-100 border border-emerald-400/30',
    iconBg: 'bg-white/20 text-white',
  },
  agency: {
    bg: 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 text-white',
    badge: 'bg-amber-950/30 text-amber-100 border border-amber-400/30',
    iconBg: 'bg-white/20 text-white',
  },
  admin: {
    bg: 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white border-b border-slate-800',
    badge: 'bg-slate-800 text-emerald-400 border border-slate-700',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
};

export default function AnnouncementBanner({ theme }) {
  const { user } = useCitizen();
  const [announcement, setAnnouncement] = useState({ enabled: false, message: '' });
  const [dismissed, setDismissed] = useState(false);

  // Determine active theme from prop or user role
  const activeRole = theme || user?.role || 'citizen';
  const themeStyle = THEMES[activeRole] || THEMES.citizen;

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/v1/system/settings');
        if (isMounted) {
          setAnnouncement({
            enabled: !!data?.announcementEnabled,
            message: data?.announcementMessage || '',
          });
        }
      } catch (err) {
        // Silent catch
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 20000); // Poll every 20 seconds for live admin updates
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!announcement.enabled || !announcement.message || dismissed) {
    return null;
  }

  return (
    <div className={`${themeStyle.bg} shadow-md relative overflow-hidden transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${themeStyle.iconBg} backdrop-blur-md flex-shrink-0 animate-pulse`}>
            <Megaphone className="h-4 w-4" />
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-white truncate tracking-wide flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${themeStyle.badge}`}>
              Announcement
            </span>
            <span className="truncate">{announcement.message}</span>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          title="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
