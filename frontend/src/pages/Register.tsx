import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  FiShield,
  FiRefreshCw,
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

// ─── OTP Input ───────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const digits = value.split('');
    // Allow only digits
    const digit = val.replace(/\D/g, '').slice(-1);
    digits[i] = digit;
    const next = digits.join('');
    onChange(next.slice(0, 6));
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      const digits = value.split('');
      if (!digits[i] && i > 0) {
        digits[i - 1] = '';
        onChange(digits.join(''));
        inputs.current[i - 1]?.focus();
      } else {
        digits[i] = '';
        onChange(digits.join(''));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const idx = Math.min(pasted.length, 5);
    inputs.current[idx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 transition-all focus:outline-none
            ${value[i]
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white'
            }
            focus:border-red-500 focus:ring-2 focus:ring-red-500/20`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Step 1 state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'bloodbank' | 'hospital'>('bloodbank');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Common
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password criteria
  const passwordCriteria = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  // ── Step 1 Submit ────────────────────────────────────────
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
        setStep(2);
        startResendCooldown();
      } else {
        setError(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 Submit ────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length < 6) return setError('Please enter the complete 6-digit OTP');

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', { email, token: otp });
      if (res.data?.success) {
        // Auto-login if the backend returned a session
        if (res.data?.data?.accessToken) {
          const { accessToken, user: u } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('authUser', JSON.stringify(u));
          // trigger auth context state update via login
          navigate('/dashboard');
        } else {
          navigate('/login', { state: { verified: true } });
        }
      } else {
        setError(res.data?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      // Re-trigger OTP by calling register with same data
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data?.success) {
        setOtp('');
        startResendCooldown();
      } else {
        setError(res.data?.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────
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
            {step === 1 ? <>Save a Life,<br />Become a Hero.</> : <>One Step Away<br />from Saving Lives.</>}
          </h2>
          <p className="text-lg text-red-100/80 font-light leading-relaxed max-w-md">
            {step === 1
              ? 'Join our growing network of blood banks and hospitals ensuring no patient waits for the blood they need.'
              : 'Check your inbox for a 6-digit OTP. It will arrive within a few seconds. Enter it to activate your account.'}
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-4 mt-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s ? 'bg-white text-red-700' : step > s ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white/60'
                }`}>
                  {step > s ? <FiCheck /> : s}
                </div>
                <span className={`text-sm font-semibold ${step === s ? 'text-white' : 'text-white/50'}`}>
                  {s === 1 ? 'Register' : 'Verify Email'}
                </span>
                {s < 2 && <div className="w-8 h-0.5 bg-white/20 rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-red-200/50 text-xs z-10">© 2024 Smart Blood Bank · Every drop counts</p>
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

            {/* ──────────── STEP 1: Registration Form ──────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold mb-4 ring-1 ring-red-200 dark:ring-red-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    Step 1 of 2
                  </div>
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
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'bloodbank', label: 'Blood Bank', icon: FiHeart },
                        { value: 'hospital', label: 'Hospital', icon: FiActivity },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value as 'bloodbank' | 'hospital')}
                          className={`flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl border-2 transition-all duration-200 ${
                            role === value
                              ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="text-xl mb-1.5" />
                          <span className="text-xs font-bold">{label}</span>
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

                    {/* Password criteria */}
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
                      <>Create Account & Send OTP <FiArrowRight /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ──────────── STEP 2: OTP Verification ──────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 ring-1 ring-emerald-200 dark:ring-emerald-800/50">
                    <FiShield className="flex-shrink-0" />
                    Step 2 of 2 — Verify Your Email
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white">Enter OTP</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm leading-relaxed">
                    We sent a <span className="font-bold text-slate-700 dark:text-slate-200">6-digit code</span> to{' '}
                    <span className="font-bold text-red-600 dark:text-red-400">{email}</span>.<br />
                    Enter it below to verify your email.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP boxes */}
                  <div className="space-y-3">
                    <OtpInput value={otp} onChange={setOtp} />
                    <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                      Check your spam folder if you don't see it
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
                    disabled={loading || otp.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Verify & Activate Account <FiCheck /></>
                    )}
                  </button>

                  {/* Resend */}
                  <div className="text-center space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Didn't receive the code?</p>
                    {resendCooldown > 0 ? (
                      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                        Resend in {resendCooldown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"
                      >
                        <FiRefreshCw className={resending ? 'animate-spin' : ''} />
                        {resending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </div>

                  {/* Back */}
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); setOtp(''); }}
                    className="w-full text-center text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    ← Go back and edit details
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
