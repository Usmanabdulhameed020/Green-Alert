/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CitizenContext = createContext();

export const useCitizen = () => useContext(CitizenContext);

// Send the stored JWT on every request
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
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('greenalert_token'));
  const [authInitialized, setAuthInitialized] = useState(false);
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('greenalert_settings');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // On page load, ask the server who we are. This keeps each role on its
  // own dashboard after a refresh.
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('greenalert_token');

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
          localStorage.setItem('greenalert_user', JSON.stringify(serverUser));
          setUser(serverUser);
        } else {
          localStorage.removeItem('greenalert_user');
          localStorage.removeItem('greenalert_token');
          setUser(null);
          setToken(null);
        }
      } catch {
        localStorage.removeItem('greenalert_user');
        localStorage.removeItem('greenalert_token');
        setUser(null);
        setToken(null);
      } finally {
        setAuthInitialized(true);
      }
    };

    verifyAuth();
  }, []);

  // Update the profile on the server, then refresh local state
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
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('greenalert_user', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (user?.settings) {
      setSettings((prev) => ({ ...(prev || {}), ...user.settings }));
      localStorage.setItem('greenalert_settings', JSON.stringify(user.settings));
    }
  }, [user]);

  const updateSettings = async (updates) => {
    const updated = { ...(settings || {}), ...updates };
    setSettings(updated);
    localStorage.setItem('greenalert_settings', JSON.stringify(updated));
    await updateUser({ settings: updated });
  };

  // Permanently delete the account
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
    setSavedReports([]);
    setSettings(null);
  };

  // Load the logged-in user's reports and saved bookmarks once
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const reportsRes = await axios.get('/api/v1/reports/my-reports').catch(() => ({ data: [] }));
        const fetchedReports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
        setReports(fetchedReports);

        const localSaved = localStorage.getItem(`ga_saved_${user.id || user._id}`);
        if (localSaved) {
          setSavedReports(JSON.parse(localSaved));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Delete a report
  const deleteReport = async (reportId) => {
    try {
      await axios.delete(`/api/v1/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => (r.id || r._id) !== reportId));
      setSavedReports((prev) => prev.filter((id) => id !== reportId));
      return true;
    } catch (err) {
      console.error('Error deleting report:', err);
      throw err;
    }
  };

  // Fetch every report (Explore page)
  const fetchAllReports = async () => {
    try {
      const res = await axios.get('/api/v1/reports');
      if (Array.isArray(res.data)) {
        setAllReports(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  // Create a new report
  const createReport = async (reportData) => {
    try {
      const res = await axios.post('/api/v1/reports', reportData);
      const newReport = res.data;
      setReports((prev) => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      console.error('Error creating report:', err);
      throw err;
    }
  };

  // Bookmark / unbookmark a report
  const toggleSaveReport = (reportId) => {
    if (!user) return;
    const userId = user.id || user._id;
    setSavedReports((prev) => {
      const updated = prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId];
      localStorage.setItem(`ga_saved_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch a single report by id
  const getReportDetails = async (reportId) => {
    try {
      const res = await axios.get(`/api/v1/reports/${reportId}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching report details:', err);
      return reports.find((r) => (r.id || r._id) === reportId);
    }
  };

  const logout = () => {
    localStorage.removeItem('greenalert_user');
    localStorage.removeItem('greenalert_token');
    axios.post('/api/v1/auth/logout').catch(() => {});
    setUser(null);
    setToken(null);
    setReports([]);
    setSavedReports([]);
  };

  return (
    <CitizenContext.Provider
      value={{
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
        savedReports,
        isLoading,
        createReport,
        deleteReport,
        toggleSaveReport,
        getReportDetails,
        logout,
      }}
    >
      {children}
    </CitizenContext.Provider>
  );
};
