import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CitizenContext = createContext();

export const useCitizen = () => useContext(CitizenContext);

// Configure axios to send the JWT token on every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('greenalert_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const CitizenProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('greenalert_user');
    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch (err) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('greenalert_token'));
  const [authInitialized, setAuthInitialized] = useState(false);
  const [reports, setReports] = useState([]);

  // On every page load/reload: verify the stored token with the server.
  // Only mark auth as initialized AFTER we know the real user role from the server.
  // This is what keeps admins on /admin, citizens on /citizen-dashboard, etc. on reload.
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('greenalert_token');

      // No token stored — user is not logged in
      if (!storedToken) {
        setUser(null);
        setAuthInitialized(true);
        return;
      }

      try {
        const res = await axios.get('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.data?.success) {
          const serverUser = res.data.data.user;
          // Update localStorage and state with fresh data from server
          localStorage.setItem('greenalert_user', JSON.stringify(serverUser));
          setUser(serverUser);
        } else {
          // Token was rejected by server — clear session
          localStorage.removeItem('greenalert_user');
          localStorage.removeItem('greenalert_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        // Network error or 401 — token is expired/invalid
        localStorage.removeItem('greenalert_user');
        localStorage.removeItem('greenalert_token');
        setUser(null);
        setToken(null);
      } finally {
        // Always mark initialized so ProtectedRoute can render
        setAuthInitialized(true);
      }
    };

    verifyAuth();
  }, []);
  const [allReports, setAllReports] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [points, setPoints] = useState(120);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const savedUser = localStorage.getItem('greenalert_user');
    if (!savedUser) return [];
    try {
      const u = JSON.parse(savedUser);
      return u.unlockedAchievements || [];
    } catch { return []; }
  });
  const [newlyUnlockedPopup, setNewlyUnlockedPopup] = useState([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('greenalert_settings');
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch (err) {
      return null;
    }
  });

  // Update the authenticated user's profile and persist it everywhere
  // (sidebar, navbar, profile page, etc. all read `user` from this context)
  const updateUser = async (updates) => {
    try {
      const res = await axios.patch('/api/v1/auth/me', updates);
      if (res.data?.success) {
        const serverUser = res.data.data.user;
        localStorage.setItem('greenalert_user', JSON.stringify(serverUser));
        setUser(serverUser);
        return;
      }
    } catch (err) {
      console.error('Failed to update user on server:', err);
    }
    // Fallback: save locally even if server fails
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('greenalert_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Synchronize settings state whenever user profile reloads
  useEffect(() => {
    if (user?.settings) {
      setSettings((prev) => ({ ...(prev || {}), ...user.settings }));
      localStorage.setItem('greenalert_settings', JSON.stringify(user.settings));
    }
  }, [user]);

  // Persist dashboard settings (notification/privacy toggles, language, etc.)
  const updateSettings = async (updates) => {
    const updated = { ...(settings || {}), ...updates };
    setSettings(updated);
    localStorage.setItem('greenalert_settings', JSON.stringify(updated));
    await updateUser({ settings: updated });
  };

  // Permanently delete the citizen account and clear all local data
  const deleteAccount = async () => {
    try {
      await axios.delete('/api/v1/auth/me');
    } catch (err) {
      console.error('Error deleting account on server:', err);
    }

    const userId = user?.id || user?._id;
    localStorage.removeItem('greenalert_user');
    localStorage.removeItem('greenalert_token');
    localStorage.removeItem('greenalert_settings');
    if (userId) {
      localStorage.removeItem(`ga_saved_${userId}`);
    }

    setUser(null);
    setReports([]);
    setNotifications([]);
    setSavedReports([]);
    setCommunities([]);
    setSettings(null);
  };

  // Fetch reports & notifications once user is authenticated
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [reportsRes, notificationsRes] = await Promise.all([
          axios.get('/api/reports/my-reports').catch(() => ({ data: [] })),
          axios.get('/api/notifications').catch(() => ({ data: [] }))
        ]);

        const fetchedReports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
        const fetchedNotifications = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];

        setReports(fetchedReports);
        setNotifications(fetchedNotifications);

        // Load saved reports from localStorage
        const localSaved = localStorage.getItem(`ga_saved_${user.id || user._id}`);
        if (localSaved) {
          setSavedReports(JSON.parse(localSaved));
        }

        // Calculate points based on reports and interactions
        const calculatedXP = 120 + fetchedReports.length * 20 + fetchedReports.filter(r => r.status === 'Resolved').length * 50;
        setPoints(calculatedXP);

        // If user xp differs from calculated, persist it
        if (user && (user.xp || 120) !== calculatedXP) {
          saveXP(calculatedXP);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Persist XP to server
  const saveXP = async (newXP) => {
    try {
      await axios.patch('/api/v1/auth/me', { xp: newXP });
    } catch {}
  };

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get('/api/v1/auth/leaderboard');
      if (res.data?.success) {
        setLeaderboard(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  // Check achievements
  const checkAchievements = useCallback(async () => {
    try {
      const res = await axios.post('/api/v1/auth/check-achievements');
      if (res.data?.success) {
        const { newlyUnlocked, unlockedAchievements: unlocked } = res.data.data;
        setUnlockedAchievements(unlocked);
        if (newlyUnlocked.length > 0) {
          const savedUser = JSON.parse(localStorage.getItem('greenalert_user') || '{}');
          savedUser.unlockedAchievements = unlocked;
          localStorage.setItem('greenalert_user', JSON.stringify(savedUser));
          setUser(prev => prev ? { ...prev, unlockedAchievements: unlocked } : prev);
          setNewlyUnlockedPopup(newlyUnlocked);
          setTimeout(() => setNewlyUnlockedPopup([]), 5000);
        }
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
  }, []);

  // Sync achievements on initial load (idempotent — only unlocks new ones)
  useEffect(() => {
    if (!user) return;
    checkAchievements();
  }, [user, checkAchievements]);

  // Add a notification received from socket (called by DashboardLayout)
  const addNotificationFromSocket = useCallback((notif) => {
    setNotifications((prev) => {
      if (prev.some((n) => (n._id || n.id) === (notif._id || notif.id))) return prev;
      return [notif, ...prev];
    });
  }, []);

  // Delete a report
  const deleteReport = async (reportId) => {
    try {
      await axios.delete(`/api/reports/${reportId}`);
      setReports(prev => prev.filter(r => (r.id || r._id) !== reportId));
      setSavedReports(prev => prev.filter(id => id !== reportId));
      setPoints(prev => Math.max(0, prev - 20));
      return true;
    } catch (err) {
      console.error('Error deleting report:', err);
      throw err;
    }
  };

  // Fetch all community reports
  const fetchAllReports = async () => {
    try {
      const res = await axios.get('/api/reports');
      if (Array.isArray(res.data)) {
        setAllReports(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch community reports:', err);
    }
  };

  // Fetch all communities
  const fetchCommunities = async () => {
    try {
      const res = await axios.get('/api/communities');
      if (Array.isArray(res.data)) {
        setCommunities(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    }
  };

  // Create a community
  const createCommunity = async (name, description) => {
    try {
      const res = await axios.post('/api/communities', { name, description });
      setCommunities(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error('Failed to create community:', err);
      throw err;
    }
  };

  // Join a community
  const joinCommunity = async (communityId) => {
    try {
      const res = await axios.post(`/api/communities/${communityId}/join`);
      setCommunities(prev => prev.map(c =>
        (c._id || c.id) === communityId ? res.data : c
      ));
    } catch (err) {
      console.error('Failed to join community:', err);
      throw err;
    }
  };

  // Leave a community
  const leaveCommunity = async (communityId) => {
    try {
      const res = await axios.post(`/api/communities/${communityId}/leave`);
      setCommunities(prev => prev.map(c =>
        (c._id || c.id) === communityId ? res.data : c
      ));
    } catch (err) {
      console.error('Failed to leave community:', err);
      throw err;
    }
  };

  // Update a community (creator only)
  const updateCommunity = async (communityId, updates) => {
    try {
      const res = await axios.patch(`/api/communities/${communityId}`, updates);
      setCommunities(prev => prev.map(c =>
        (c._id || c.id) === communityId ? res.data : c
      ));
      return res.data;
    } catch (err) {
      console.error('Failed to update community:', err);
      throw err;
    }
  };

  // Poll functions
  const [polls, setPolls] = useState([]);

  const fetchPolls = async (communityId) => {
    try {
      const res = await axios.get(`/api/polls/community/${communityId}`);
      if (Array.isArray(res.data)) setPolls(res.data);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
    }
  };

  const createPoll = async (communityId, question, options) => {
    try {
      const res = await axios.post(`/api/polls/community/${communityId}`, { question, options });
      setPolls(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error('Failed to create poll:', err);
      throw err;
    }
  };

  const votePoll = async (pollId, optionIndex) => {
    try {
      const res = await axios.post(`/api/polls/${pollId}/vote`, { optionIndex });
      setPolls(prev => prev.map(p => (p._id || p.id) === pollId ? res.data : p));
      return res.data;
    } catch (err) {
      console.error('Failed to vote:', err);
      throw err;
    }
  };

  // Delete a community (creator only)
  const deleteCommunity = async (communityId) => {
    try {
      await axios.delete(`/api/communities/${communityId}`);
      setCommunities(prev => prev.filter(c => (c._id || c.id) !== communityId));
    } catch (err) {
      console.error('Failed to delete community:', err);
      throw err;
    }
  };

  // Create a new report
  const createReport = async (reportData) => {
    try {
      const res = await axios.post('/api/reports', reportData);
      const newReport = res.data;
      
      setReports(prev => [newReport, ...prev]);
      
      // Auto-trigger a system notification for the report submission
      await addNotification({
        title: 'Report Submitted Successfully',
        message: `Your report "${newReport.title}" has been successfully logged and routed.`,
        type: 'report_status',
        report: newReport._id || newReport.id
      });
      
      // Increment points for report submission
      const newPoints = points + 20;
      setPoints(newPoints);
      await saveXP(newPoints);
      await checkAchievements();
      return newReport;
    } catch (err) {
      console.error('Error creating report:', err);
      throw err;
    }
  };

  // Toggle saving/bookmarking a report
  const toggleSaveReport = (reportId) => {
    if (!user) return;
    const userId = user.id || user._id;
    setSavedReports(prev => {
      let updated;
      if (prev.includes(reportId)) {
        updated = prev.filter(id => id !== reportId);
      } else {
        updated = [...prev, reportId];
      }
      localStorage.setItem(`ga_saved_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch a single report by ID (loads live comments/status changes)
  const getReportDetails = async (reportId) => {
    try {
      const res = await axios.get(`/api/reports/${reportId}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching report details:', err);
      // Fallback lookup from state if network fails
      return reports.find(r => (r.id || r._id) === reportId);
    }
  };

  // Add Comment to a report
  const addComment = async (reportId, text) => {
    if (!user) return;
    try {
      const res = await axios.post(`/api/reports/${reportId}/comments`, { text });
      const comment = res.data;

      setReports(prev => prev.map(rep => {
        if ((rep.id || rep._id) === reportId) {
          const comments = rep.comments ? [...rep.comments, comment] : [comment];
          return { ...rep, comments };
        }
        return rep;
      }));

      return comment;
    } catch (err) {
      console.error('Error adding comment:', err);
      // Fallback: local simulation
      const comment = {
        _id: Date.now().toString(),
        user: user.id || user._id,
        text,
        createdAt: new Date().toISOString(),
      };
      setReports(prev => prev.map(rep => {
        if ((rep.id || rep._id) === reportId) {
          const comments = rep.comments ? [...rep.comments, comment] : [comment];
          return { ...rep, comments };
        }
        return rep;
      }));
      return comment;
    }
  };

  // Create a Notification
  const addNotification = async ({ title, message, type, report }) => {
    try {
      const res = await axios.post('/api/notifications', {
        user: user.id || user._id,
        title,
        message,
        type,
        report
      });
      setNotifications(prev => {
        const notif = res.data;
        if (prev.some((n) => (n._id || n.id) === (notif._id || notif.id))) return prev;
        return [notif, ...prev];
      });
    } catch (err) {
      // Offline fallback
      const mockNotification = {
        id: Date.now().toString(),
        title,
        message,
        type,
        report,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => {
        if (prev.some((n) => n.title === mockNotification.title && n.message === mockNotification.message)) return prev;
        return [mockNotification, ...prev];
      });
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => 
        (n.id || n._id) === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      // Fallback
      setNotifications(prev => prev.map(n => 
        (n.id || n._id) === notificationId ? { ...n, isRead: true } : n
      ));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Simulate bulk update on API, or iterate
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n => axios.patch(`/api/notifications/${n.id || n._id}/read`).catch(() => {}))
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => (n.id || n._id) !== notificationId));
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
    } catch (err) {
      console.error('Failed to delete notification on server:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('greenalert_user');
    localStorage.removeItem('greenalert_token');
    axios.post('/api/v1/auth/logout').catch(() => {});
    setUser(null);
    setToken(null);
    setReports([]);
    setNotifications([]);
    setSavedReports([]);
  };

  return (
    <CitizenContext.Provider value={{
      user,
      token,
      setToken,
      authInitialized,
      setUser,
      updateUser,
      settings,
      updateSettings,
      deleteAccount,
      reports,
      setReports,
      allReports,
      fetchAllReports,
      communities,
      fetchCommunities,
      createCommunity,
      updateCommunity,
      joinCommunity,
      leaveCommunity,
      deleteCommunity,
      polls,
      fetchPolls,
      createPoll,
      votePoll,
      notifications,
      savedReports,
      points,
      isLoading,
      createReport,
      deleteReport,
      toggleSaveReport,
      getReportDetails,
      addComment,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      logout,
      leaderboard,
      fetchLeaderboard,
      unlockedAchievements,
      newlyUnlockedPopup,
      checkAchievements,
      addNotificationFromSocket,
    }}>
      {children}
    </CitizenContext.Provider>
  );
};
