import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiX,
  FiClock,
} from 'react-icons/fi';

// ─── Helpers ────────────────────────────────────────────────
function CriteriaRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${ok ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
      {ok ? <FiCheck className="flex-shrink-0" /> : <FiX className="flex-shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'bloodbank' | 'hospital' | 'donor'>('bloodbank');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const passwordCriteria = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Full name is required');
    if (!email.trim()) return setError('Email is required');
    if (!isPasswordValid) return setError('Please meet all password requirements');

    try {
      setLoading(true);
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data?.success) {
        setRegistered(true);
      } else {
        setError(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">

      {/* Left Panel */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-gradient-to-br from-red-700 via-red-800 to-red-950 text-white overflow-hidden font-sans">
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-red-600/25 blur-3xl animate-float-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-red-500/20 blur-3xl animate-float-slower" />

        <div className="relative flex items-center gap-3 z-10">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg">
            <FiActivity className="text-2xl text-red-100" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">Smart Blood Bank</span>
        </div>

        <div className="relative my-auto space-y-6 z-10">
          <h2 className="text-4xl xl:text-5xl font-black leading-tight">
            {registered ? <>Account<br />Created!</> : <>Save a Life,<br />Become a Hero.</>}
          </h2>
          <p className="text-lg text-red-100/80 font-light leading-relaxed max-w-md">
            {registered
              ? 'Your account is pending admin approval. You will receive access once approved.'
              : 'Join our growing network of blood banks, hospitals, and donors ensuring no patient waits for the blood they need.'}
          </p>
        </div>

        <p className="relative text-red-200/50 text-xs z-10">© {new Date().getFullYear()} Smart Blood Bank · Every drop counts</p>
      </div>

      {/* Right Panel — Form */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-600/30">
              <FiActivity className="text-xl text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">Smart Blood Bank</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── SUCCESS STATE ── */}
            {registered && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center ring-4 ring-amber-200 dark:ring-amber-800/40">
                    <FiClock className="text-3xl text-amber-600 dark:text-amber-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white">Account Created!</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Your account has been created successfully and is now <strong className="text-amber-600 dark:text-amber-400">pending admin approval</strong>. You will be able to log in once the admin approves your account.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    ⏳ This usually takes 24–48 hours. Please check back later or contact support.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/30 hover:-translate-y-0.5 transition-all"
                >
                  Go to Login <FiArrowRight />
                </button>
              </motion.div>
            )}

            {/* ── REGISTRATION FORM ── */}
            {!registered && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white">Create Account</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                    Already registered?{' '}
                    <button onClick={() => navigate('/login')} className="text-red-600 dark:text-red-400 font-semibold hover:underline">
                      Sign in
                    </button>
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name / Organization"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-slate-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-slate-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">I am registering as a</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'bloodbank', label: 'Blood Bank', icon: FiHeart },
                        { value: 'hospital', label: 'Hospital', icon: FiActivity },
                        { value: 'donor', label: 'Donor', icon: FiUser },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value as 'bloodbank' | 'hospital' | 'donor')}
                          className={`flex flex-col items-center justify-center py-3.5 px-2.5 rounded-2xl border-2 transition-all duration-200 ${
                            role === value
                              ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="text-xl mb-1.5" />
                          <span className="text-[10px] font-bold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-slate-800 dark:text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 pt-2 px-1">
                        <CriteriaRow ok={passwordCriteria.length} label="8+ characters" />
                        <CriteriaRow ok={passwordCriteria.hasUpper} label="Uppercase letter" />
                        <CriteriaRow ok={passwordCriteria.hasLower} label="Lowercase letter" />
                        <CriteriaRow ok={passwordCriteria.hasNumber} label="Number" />
                        <CriteriaRow ok={passwordCriteria.hasSpecial} label="Special character" />
                      </div>
                    )}
                  </div>

                  {/* Info notice */}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                    <FiClock className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      Your account will require <strong>admin approval</strong> before you can log in.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-medium">
                      <FiX className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Create Account <FiArrowRight /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
