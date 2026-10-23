import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/ui/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import { ModalProvider } from './contexts/ModalContext';
import { CitizenProvider } from './contexts/CitizenContext';
import ToastContainer from './components/ui/ToastContainer';
import ModalContainer from './components/ui/ModalContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OrgRegister from './pages/OrgRegister';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import MyReports from './pages/dashboard/MyReports';
import ReportDetails from './pages/dashboard/ReportDetails';
import CreateReport from './pages/dashboard/CreateReport';
import ExploreReports from './pages/dashboard/ExploreReports';
import MapPage from './pages/dashboard/MapPage';
import SavedReports from './pages/dashboard/SavedReports';
import ProfilePage from './pages/dashboard/ProfilePage';
import SettingsPage from './pages/dashboard/SettingsPage';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminReportDetails from './pages/admin/AdminReportDetails';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminSettings from './pages/admin/AdminSettings';

import AgencyLayout from './layouts/AgencyLayout';
import AgencyDashboard from './pages/agency/AgencyDashboard';
import AgencyReports from './pages/agency/AgencyReports';
import AgencyReportDetails from './pages/agency/AgencyReportDetails';
import AgencySettings from './pages/agency/AgencySettings';

function App() {
  return (
    <Router>
      <HelmetProvider>
        <ToastProvider>
          <ModalProvider>
            <CitizenProvider>
              <ErrorBoundary>
                <Routes>
                {/* Public pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register-org" element={<OrgRegister />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/report" element={<Navigate to="/citizen-dashboard/create-report" replace />} />

                {/* Citizen dashboard */}
                <Route path="/citizen-dashboard" element={<ProtectedRoute roles={['citizen']}><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardHome />} />
                  <Route path="my-reports" element={<MyReports />} />
                  <Route path="reports/:id" element={<ReportDetails />} />
                  <Route path="create-report" element={<CreateReport />} />
                  <Route path="explore" element={<ExploreReports />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="saved" element={<SavedReports />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Admin dashboard */}
                <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="reports/:id" element={<AdminReportDetails />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="organizations" element={<AdminOrganizations />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Agency dashboard */}
                <Route path="/agency" element={<ProtectedRoute roles={['agency']}><AgencyLayout /></ProtectedRoute>}>
                  <Route index element={<AgencyDashboard />} />
                  <Route path="reports" element={<AgencyReports />} />
                  <Route path="reports/:id" element={<AgencyReportDetails />} />
                  <Route path="settings" element={<AgencySettings />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <ToastContainer />
              <ModalContainer />
            </ErrorBoundary>
          </CitizenProvider>
        </ModalProvider>
      </ToastProvider>
    </HelmetProvider>
    </Router>
  );
}

export default App;
