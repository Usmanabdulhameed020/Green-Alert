import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AlertModalProvider } from './contexts/AlertModalContext';
import { CitizenProvider } from './contexts/CitizenContext';
import { SocketProvider } from './contexts/SocketContext';
import { HelmetProvider } from 'react-helmet-async';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import CookieConsent from './components/ui/CookieConsent';
import AIChatBot from './components/ui/AIChatBot';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OrgRegister = lazy(() => import('./pages/OrgRegister'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Report = lazy(() => import('./pages/Report'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const MyReports = lazy(() => import('./pages/dashboard/MyReports'));
const ReportDetails = lazy(() => import('./pages/dashboard/ReportDetails'));
const CreateReport = lazy(() => import('./pages/dashboard/CreateReport'));
const ExploreReports = lazy(() => import('./pages/dashboard/ExploreReports'));
const MapPage = lazy(() => import('./pages/dashboard/MapPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/NotificationsPage'));
const CommunityPage = lazy(() => import('./pages/dashboard/CommunityPage'));
const CommunityDetail = lazy(() => import('./pages/dashboard/CommunityDetail'));
const SavedReports = lazy(() => import('./pages/dashboard/SavedReports'));
const AchievementsPage = lazy(() => import('./pages/dashboard/AchievementsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminReportDetails = lazy(() => import('./pages/admin/AdminReportDetails'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrganizations = lazy(() => import('./pages/admin/AdminOrganizations'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AgencyLayout = lazy(() => import('./layouts/AgencyLayout'));
const AgencyDashboard = lazy(() => import('./pages/agency/AgencyDashboard'));
const AgencyReports = lazy(() => import('./pages/agency/AgencyReports'));
const AgencyReportDetails = lazy(() => import('./pages/agency/AgencyReportDetails'));
const AgencySettings = lazy(() => import('./pages/agency/AgencySettings'));
const AgencyAnalytics = lazy(() => import('./pages/agency/AgencyAnalytics'));
const ProtectedRoute = lazy(() => import('./components/ui/ProtectedRoute'));
// Auth pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-semibold">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <HelmetProvider>
      <ToastProvider>
        <AlertModalProvider>
        <NotificationProvider>
          <CitizenProvider>
            <SocketProvider>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/register-org" element={<OrgRegister />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<Terms />} />

                    {/* Legacy route fallback */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/report" element={<Navigate to="/citizen-dashboard/create-report" replace />} />

                    {/* Nested Citizen Dashboard Routes */}
                    <Route path="/citizen-dashboard" element={<ProtectedRoute roles={['citizen']}><DashboardLayout /></ProtectedRoute>}>
                      <Route index element={<DashboardHome />} />
                      <Route path="my-reports" element={<MyReports />} />
                      <Route path="reports/:id" element={<ReportDetails />} />
                      <Route path="create-report" element={<CreateReport />} />
                      <Route path="explore" element={<ExploreReports />} />
                      <Route path="map" element={<MapPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="community" element={<CommunityPage />} />
                      <Route path="community/:id" element={<CommunityDetail />} />
                      <Route path="saved" element={<SavedReports />} />
                      <Route path="achievements" element={<AchievementsPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="reports/:id" element={<AdminReportDetails />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="organizations" element={<AdminOrganizations />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    {/* Agency Routes */}
                    <Route path="/agency" element={<ProtectedRoute roles={['agency']}><AgencyLayout /></ProtectedRoute>}>
                      <Route index element={<AgencyDashboard />} />
                      <Route path="reports" element={<AgencyReports />} />
                      <Route path="reports/:id" element={<AgencyReportDetails />} />
                      <Route path="analytics" element={<AgencyAnalytics />} />
                      <Route path="settings" element={<AgencySettings />} />
                    </Route>
                    {/* 404 Catch All */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
              <ToastContainer />
              <CookieConsent />
              <AIChatBot />
            </SocketProvider>
          </CitizenProvider>
        </NotificationProvider>
        </AlertModalProvider>
      </ToastProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;
