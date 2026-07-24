import { Navigate } from 'react-router-dom';

export default function LegacyDashboard() {
  return <Navigate to="/citizen-dashboard" replace />;
}
