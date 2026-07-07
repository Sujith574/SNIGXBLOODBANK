import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import LandingPage from '../pages/LandingPage';
import BloodbankDashboard from '../pages/BloodbankDashboard';
import HospitalDashboard from '../pages/HospitalDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import BloodAvailabilitySearch from '../pages/BloodAvailabilitySearch';
import BloodRequestStatus from '../pages/BloodRequestStatus';
import DonorAvailabilityList from '../pages/DonorAvailabilityList';
import DonorDashboard from '../pages/DonorDashboard';

// Guard that redirects unauthenticated users to login
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Redirects logged-in users away from public pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (accessToken && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Role-based dashboard selector
function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'hospital') return <HospitalDashboard />;
  if (user?.role === 'donor') return <DonorDashboard />;
  return <BloodbankDashboard />;
}

export default function Routes() {
  return (
    <RouterRoutes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      {/* Blood Bank routes */}
      <Route path="/donors" element={<PrivateRoute><DonorAvailabilityList /></PrivateRoute>} />
      <Route path="/requests" element={<PrivateRoute><BloodbankDashboard /></PrivateRoute>} />

      {/* Hospital routes */}
      <Route path="/requests/status" element={<PrivateRoute><BloodRequestStatus /></PrivateRoute>} />
      <Route path="/blood/availability" element={<PrivateRoute><BloodAvailabilitySearch /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
}
