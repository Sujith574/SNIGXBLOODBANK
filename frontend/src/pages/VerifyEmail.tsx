import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiLoader, 
  FiArrowRight, 
  FiActivity 
} from 'react-icons/fi';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link or try registering again.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        if (res.data?.success) {
          setStatus('success');
          setMessage(res.data?.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(res.data?.message || 'Failed to verify email. The link might be invalid or expired.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.response?.data?.message || err?.message || 'An error occurred during verification.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 overflow-hidden font-sans">
      {/* Visual Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-red-600/10 dark:bg-red-600/5 blur-3xl animate-float-slow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl animate-float-slower" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/30">
              <FiActivity className="text-2xl text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
              Smart Blood Bank
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-md">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center space-y-6 py-6"
              >
                <div className="relative">
                  <FiLoader className="text-5xl text-red-600 animate-spin" />
                  <div className="absolute inset-0 bg-red-600/10 blur-xl rounded-full scale-150 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Email</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light max-w-xs">
                    Please hold on while we secure your account details.
                  </p>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center space-y-6 py-4"
              >
                <div className="relative">
                  <FiCheckCircle className="text-6xl text-emerald-500" />
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Verification Success!</h3>
                  <p className="text-emerald-600 dark:text-emerald-400/90 text-sm font-medium">
                    {message}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-light max-w-xs pt-1">
                    Your account has been activated. You can now log in and start saving lives.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/35 transition-all duration-300 transform active:scale-[0.98]"
                >
                  Proceed to Login
                  <FiArrowRight />
                </button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center space-y-6 py-4"
              >
                <div className="relative">
                  <FiXCircle className="text-6xl text-rose-500" />
                  <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Verification Failed</h3>
                  <p className="text-rose-600 dark:text-rose-400/90 text-sm font-medium max-w-xs leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="w-full space-y-3 mt-4">
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold transition-all duration-300 transform active:scale-[0.98]"
                  >
                    Go back to Register
                  </button>
                  <Link
                    to="/login"
                    className="block text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Return to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
