import { Navigate } from 'react-router-dom';
import { useCitizen } from '../../contexts/CitizenContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, authInitialized } = useCitizen();

  // Show spinner while verifying token with server — prevents premature redirect
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but wrong role for this route → send to their own dashboard
  if (!roles.includes(user.role)) {
    const redirectPath =
      user.role === 'admin' ? '/admin' :
      user.role === 'agency' ? '/agency' :
      '/citizen-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
