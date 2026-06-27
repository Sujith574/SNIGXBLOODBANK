import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import BloodbankDashboard from '../pages/BloodbankDashboard';
import HospitalDashboard from '../pages/HospitalDashboard';
import AdminDashboard from '../pages/AdminDashboard';

// Guard mapping matching user roles to proper dashboards
function AuthenticatedDashboard() {
  const { user, accessToken, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'hospital') return <HospitalDashboard />;
  return <BloodbankDashboard />;
}

export default function Routes() {
  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/" element={<AuthenticatedDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
}



