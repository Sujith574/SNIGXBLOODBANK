import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
   FiLogOut, 
   FiActivity, 
   FiUser, 
   FiShield, 
   FiHeart, 
   FiLayers 
} from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    if (user?.role === 'admin') return <FiShield className="text-red-400 text-xl" />;
    if (user?.role === 'hospital') return <FiLayers className="text-red-400 text-xl" />;
    return <FiHeart className="text-red-400 text-xl" />;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md hidden md:flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-500/25">
              <FiActivity className="text-white text-xl" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
              Smart Blood Bank
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navigation
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold transition-all"
            >
              {getRoleIcon()}
              <span className="capitalize">{user?.role} Portal</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-extrabold shadow-md">
              {user?.name?.[0].toUpperCase() || user?.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm truncate">{user?.name || 'Authorized User'}</h4>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 hover:bg-red-500/10 hover:text-red-500 transition-all font-semibold text-sm cursor-pointer"
          >
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Navbar Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl">
              <FiActivity className="text-white text-lg" />
            </div>
            <span className="font-black text-md">Smart Blood Bank</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer"
          >
            <FiLogOut className="text-lg" />
          </button>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 xl:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
