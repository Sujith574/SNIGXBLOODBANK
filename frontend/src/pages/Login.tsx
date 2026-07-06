import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiX
} from 'react-icons/fi';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Show success banner when redirected from OTP verification
  const justVerified = (location.state as any)?.verified === true;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password, remember });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Visual Left Panel - Hidden on Mobile */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-gradient-to-br from-red-700 via-red-800 to-red-950 text-white overflow-hidden font-sans">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-red-600/25 blur-3xl animate-float-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-red-500/20 blur-3xl animate-float-slower" />

        {/* Top Header */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg animate-pulse-glow">
            <FiActivity className="text-2xl text-red-100" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-red-200">
              Smart Blood Bank
            </span>
          </div>
        </div>

        {/* Core Value Statement */}
        <div className="relative my-auto space-y-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-4xl xl:text-5xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-100">
              Welcome Back,<br/>Save a Life Today.
            </h2>
            <p className="text-lg text-red-100/80 font-light leading-relaxed max-w-md">
              Sign in to manage requests, view blood donation drives, or search compatibility parameters. Together we build a healthier tomorrow.
            </p>
          </motion.div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl font-extrabold">10k+</div>
              <div className="text-xs text-red-100/70 mt-1">Donors Registered</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl font-extrabold">500+</div>
              <div className="text-xs text-red-100/70 mt-1">Hospitals Connected</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative text-xs text-red-200/60 z-10">
          © {new Date().getFullYear()} Smart Blood Bank System. All rights reserved.
        </div>
      </div>

      {/* Interactive Form Panel */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-4 sm:px-8 py-10 relative">
        {/* Glow Element */}
        <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] rounded-full bg-red-400/5 dark:bg-red-400/2.5 blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/40 dark:border-slate-800/40"
        >
          {/* Form Header */}
          <div className="text-center sm:text-left mb-8">
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <FiMail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-slate-800 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span
                  className="text-xs text-slate-400 dark:text-slate-500 cursor-default select-none"
                >
                  Need help? Contact support.
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-slate-800 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center">
              <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4.5 h-4.5 text-red-600 border-slate-300 dark:border-slate-800 rounded-md focus:ring-red-500/50 focus:ring-2"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Notifications & Error messages */}
            <AnimatePresence mode="wait">
              {justVerified && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 text-sm flex items-center gap-2"
                >
                  <FiCheck className="flex-shrink-0 w-5 h-5 font-bold" />
                  <span>Email verified! You can now sign in.</span>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 text-sm flex items-center gap-2"
                >
                  <FiX className="flex-shrink-0 w-5 h-5 font-bold" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 px-4 font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all duration-300 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirection */}
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-6">
            Don't have an account?{' '}
            <button
              type="button"
              className="text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer transition-all focus:outline-none"
              onClick={() => navigate('/register')}
            >
              Create account
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
