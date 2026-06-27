import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiShield, 
  FiHeart, 
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiX
} from 'react-icons/fi';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('donor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Password requirements state
  const passwordCriteria = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password, role });
      setSuccessMsg('Registration successful. Please verify your email.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
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
              Save a Life,<br/>Become a Hero.
            </h2>
            <p className="text-lg text-red-100/80 font-light leading-relaxed max-w-md">
              Connecting volunteer blood donors with clinics, hospitals, and emergency requests instantly. Every drop counts.
            </p>
          </motion.div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl font-extrabold">100%</div>
              <div className="text-xs text-red-100/70 mt-1">Real-time matching</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <div className="text-2xl font-extrabold">24/7</div>
              <div className="text-xs text-red-100/70 mt-1">Emergency requests</div>
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
              Create an Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Register now to start requesting or donating blood.
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <FiUser className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-slate-800 dark:text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

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

            {/* Role Card Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                I want to register as a
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Blood Bank option */}
                <button
                  type="button"
                  onClick={() => setRole('bloodbank' as any)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    role === ('bloodbank' as any)
                      ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-md ring-2 ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <FiHeart className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold text-center">Blood Bank</span>
                </button>

                {/* Hospital option */}
                <button
                  type="button"
                  onClick={() => setRole('hospital')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    role === 'hospital'
                      ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-md ring-2 ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <FiActivity className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold text-center">Hospital</span>
                </button>

                {/* Admin option */}
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    role === 'admin'
                      ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-md ring-2 ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <FiShield className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold text-center">Admin</span>
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>

              {/* Real-time requirements checklist */}
              {password.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 px-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500"
                >
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.length ? (
                      <FiCheck className="text-green-500 font-bold" />
                    ) : (
                      <FiX className="text-slate-400" />
                    )}
                    <span className={passwordCriteria.length ? 'text-green-600 dark:text-green-400' : ''}>8+ Characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.hasUpper ? (
                      <FiCheck className="text-green-500 font-bold" />
                    ) : (
                      <FiX className="text-slate-400" />
                    )}
                    <span className={passwordCriteria.hasUpper ? 'text-green-600 dark:text-green-400' : ''}>Uppercase Letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.hasLower ? (
                      <FiCheck className="text-green-500 font-bold" />
                    ) : (
                      <FiX className="text-slate-400" />
                    )}
                    <span className={passwordCriteria.hasLower ? 'text-green-600 dark:text-green-400' : ''}>Lowercase Letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordCriteria.hasNumber ? (
                      <FiCheck className="text-green-500 font-bold" />
                    ) : (
                      <FiX className="text-slate-400" />
                    )}
                    <span className={passwordCriteria.hasNumber ? 'text-green-600 dark:text-green-400' : ''}>Number</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    {passwordCriteria.hasSpecial ? (
                      <FiCheck className="text-green-500 font-bold" />
                    ) : (
                      <FiX className="text-slate-400" />
                    )}
                    <span className={passwordCriteria.hasSpecial ? 'text-green-600 dark:text-green-400' : ''}>Special Character</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Notifications & Error messages */}
            <AnimatePresence mode="wait">
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
              
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 text-sm flex items-center gap-2"
                >
                  <FiCheck className="flex-shrink-0 w-5 h-5 font-bold" />
                  <span>{successMsg}</span>
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
                  <span>Create Account</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirection */}
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-6">
            Already have an account?{' '}
            <button
              type="button"
              className="text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer transition-all focus:outline-none"
              onClick={() => navigate('/login')}
            >
              Log in here
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
