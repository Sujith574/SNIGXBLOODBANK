import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiLogOut,
  FiActivity,
  FiShield,
  FiHeart,
  FiLayers,
  FiList,
  FiSearch,
  FiUsers,
  FiClipboard,
  FiHome,
  FiMenu,
  FiX,
} from 'react-icons/fi';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

function getNavItems(role: string | undefined): NavItem[] {
  if (role === 'bloodbank') {
    return [
      { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
      { label: 'Donor Registry', icon: <FiUsers />, path: '/donors' },
      { label: 'Blood Requests', icon: <FiClipboard />, path: '/requests' },
    ];
  }
  if (role === 'hospital') {
    return [
      { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
      { label: 'New Blood Request', icon: <FiHeart />, path: '/dashboard' },
      { label: 'My Requests', icon: <FiList />, path: '/requests/status' },
      { label: 'Blood Availability', icon: <FiSearch />, path: '/blood/availability' },
    ];
  }
  if (role === 'admin') {
    return [
      { label: 'Overview', icon: <FiActivity />, path: '/dashboard' },
      { label: 'Blood Banks', icon: <FiHeart />, path: '/dashboard' },
      { label: 'Hospitals', icon: <FiLayers />, path: '/dashboard' },
    ];
  }
  return [{ label: 'Dashboard', icon: <FiHome />, path: '/dashboard' }];
}

interface LayoutProps {
  children: React.ReactNode;
}

interface SidebarProps {
  role?: string;
  userName?: string;
  userEmail?: string;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function SidebarContent({ role, userName, userEmail, navItems, currentPath, onNavigate, onLogout }: SidebarProps) {
  const getRoleGradient = () => {
    if (role === 'admin') return 'from-purple-600 to-violet-700';
    if (role === 'hospital') return 'from-blue-600 to-indigo-700';
    return 'from-red-600 to-rose-700';
  };

  const getRoleIcon = () => {
    if (role === 'admin') return <FiShield className="text-purple-400 text-xl" />;
    if (role === 'hospital') return <FiLayers className="text-blue-400 text-xl" />;
    return <FiHeart className="text-red-400 text-xl" />;
  };

  const getRoleLabel = () => {
    if (role === 'admin') return 'Admin';
    if (role === 'hospital') return 'Hospital';
    return 'Blood Bank';
  };

  const gradient = getRoleGradient();

  return (
    <div className="flex flex-col h-full p-6">
      <div className="space-y-8 flex-1">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
            <FiActivity className="text-white text-xl" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
            Smart Blood Bank
          </span>
        </div>

        {/* Role Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${gradient} text-white`}>
          {getRoleIcon()}
          <span className="text-sm font-bold">{getRoleLabel()} Portal</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path + item.label}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${
                  isActive
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold shadow-md`}>
            {(userName?.[0] ?? userEmail?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate">{userName || 'Authorized User'}</h4>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 hover:bg-red-500/10 hover:text-red-500 transition-all font-semibold text-sm cursor-pointer"
        >
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const navItems = getNavItems(user?.role);

  const sidebarProps: SidebarProps = {
    role: user?.role,
    userName: user?.name,
    userEmail: user?.email,
    navItems,
    currentPath: location.pathname,
    onNavigate: handleNavigate,
    onLogout: handleLogout,
  };

  const getRoleGradient = () => {
    if (user?.role === 'admin') return 'from-purple-600 to-violet-700';
    if (user?.role === 'hospital') return 'from-blue-600 to-indigo-700';
    return 'from-red-600 to-rose-700';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="w-64 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md hidden md:flex flex-col">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
        >
          <FiX />
        </button>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br ${getRoleGradient()} rounded-xl`}>
              <FiActivity className="text-white text-lg" />
            </div>
            <span className="font-black text-md">Smart Blood Bank</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
            >
              <FiMenu className="text-lg" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500"
            >
              <FiLogOut className="text-lg" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 xl:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
