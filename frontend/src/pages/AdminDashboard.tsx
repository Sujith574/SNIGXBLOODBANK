import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { api } from '../utils/api';
import { FiUsers, FiHeart, FiActivity, FiShield, FiCheckCircle, FiXCircle, FiRefreshCw, FiClock, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface BloodBank {
  id: string;
  name: string;
  email: string;
  city?: string;
  state?: string;
  is_approved: boolean;
  created_at: string;
}

interface Hospital {
  id: string;
  name: string;
  email: string;
  city?: string;
  state?: string;
  doctor_name?: string;
  is_approved: boolean;
  created_at: string;
}

interface Stats {
  total_bloodbanks: number;
  total_hospitals: number;
  total_requests: number;
  pending_requests: number;
  fulfilled_requests: number;
  total_donors: number;
  pending_approvals: number;
}

const ROLE_COLORS: Record<string, string> = {
  bloodbank: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  hospital: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  donor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'bloodbanks' | 'hospitals'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [bloodbanks, setBloodbanks] = useState<BloodBank[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, bbRes, hospRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/pending-users'),
        api.get('/admin/bloodbanks'),
        api.get('/admin/hospitals'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || null);
      if (pendingRes.status === 'fulfilled') {
        const d = pendingRes.value.data?.data;
        setPendingUsers(Array.isArray(d) ? d : []);
      }
      if (bbRes.status === 'fulfilled') {
        const d = bbRes.value.data?.data;
        setBloodbanks(Array.isArray(d) ? d : []);
      }
      if (hospRes.status === 'fulfilled') {
        const d = hospRes.value.data?.data;
        setHospitals(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId + '-approve');
    try {
      await api.post('/admin/approve-user', { userId });
      showToast('User approved successfully!');
      await load();
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reject and permanently delete this user account?')) return;
    setActionLoading(userId + '-reject');
    try {
      await api.post('/admin/reject-user', { userId });
      showToast('User rejected and removed.');
      await load();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: 'Blood Banks', value: stats?.total_bloodbanks ?? '—', icon: FiHeart, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30' },
    { label: 'Hospitals', value: stats?.total_hospitals ?? '—', icon: FiActivity, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
    { label: 'Total Requests', value: stats?.total_requests ?? '—', icon: FiShield, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
    { label: 'Total Donors', value: stats?.total_donors ?? '—', icon: FiUsers, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'pending', label: `Pending Approvals${pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ''}` },
    { id: 'bloodbanks', label: `Blood Banks (${bloodbanks.length})` },
    { id: 'hospitals', label: `Hospitals (${hospitals.length})` },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold transition-all animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <FiCheck /> : <FiX />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Admin Control Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and oversee the entire Smart Blood Bank network</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-purple-50 hover:text-purple-600 transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Pending approvals banner */}
        {pendingUsers.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <FiAlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 text-xl" />
            <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm">
              {pendingUsers.length} account{pendingUsers.length > 1 ? 's are' : ' is'} waiting for your approval.{' '}
              <button onClick={() => setActiveTab('pending')} className="underline hover:no-underline">
                Review now →
              </button>
            </p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, shadow }) => (
            <div key={label} className={`rounded-3xl p-6 bg-gradient-to-br ${color} text-white shadow-xl ${shadow}`}>
              <div className="flex items-center justify-between mb-4">
                <Icon className="text-2xl text-white/80" />
                <div className="w-8 h-8 rounded-xl bg-white/20" />
              </div>
              <div className="text-3xl font-black">{value}</div>
              <div className="text-sm text-white/80 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Request Progress */}
        {stats && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl p-8">
            <h2 className="font-bold text-lg mb-6">Blood Request Summary</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-5">
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pending_requests}</div>
                <div className="text-sm font-semibold text-amber-700 dark:text-amber-500 mt-1">Pending</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-5">
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.fulfilled_requests}</div>
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-500 mt-1">Fulfilled</div>
              </div>
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-5">
                <div className="text-3xl font-black">{stats.total_requests}</div>
                <div className="text-sm font-semibold text-slate-500 mt-1">Total</div>
              </div>
            </div>
            {stats.total_requests > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Fulfillment rate</span>
                  <span>{Math.round((stats.fulfilled_requests / stats.total_requests) * 100)}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
                    style={{ width: `${Math.round((stats.fulfilled_requests / stats.total_requests) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`whitespace-nowrap px-5 py-3 text-sm font-bold rounded-t-xl transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-900 text-purple-600 border-t border-l border-r border-slate-200 dark:border-slate-800 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }${t.id === 'pending' && pendingUsers.length > 0 ? ' text-amber-600' : ''}`}
            >
              {t.id === 'pending' && pendingUsers.length > 0 && <FiClock className="inline mr-1.5 -mt-0.5" />}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PENDING APPROVALS TAB ── */}
        {activeTab === 'pending' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden">
            {pendingUsers.length === 0 && !loading ? (
              <div className="text-center py-16 text-slate-400">
                <FiCheckCircle className="mx-auto text-4xl mb-3 text-emerald-300" />
                <p className="font-semibold">All caught up! No pending approvals.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">#</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Name</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Email</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Role</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Registered</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingUsers.map((u, i) => (
                      <tr key={u.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold capitalize ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(u.id)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === u.id + '-approve' ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : <FiCheck />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(u.id)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {actionLoading === u.id + '-reject' ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : <FiX />}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BLOOD BANKS TAB ── */}
        {activeTab === 'bloodbanks' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden">
            {bloodbanks.length === 0 && !loading ? (
              <div className="text-center py-16 text-slate-400">
                <FiHeart className="mx-auto text-4xl mb-3 text-red-200" />
                <p>No blood banks registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">#</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Name</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Email</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Location</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Status</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bloodbanks.map((bb, i) => (
                      <tr key={bb.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                              {bb.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold">{bb.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{bb.email}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{[bb.city, bb.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-6 py-4">
                          {bb.is_approved ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                              <FiCheckCircle /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                              <FiClock /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(bb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── HOSPITALS TAB ── */}
        {activeTab === 'hospitals' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden">
            {hospitals.length === 0 && !loading ? (
              <div className="text-center py-16 text-slate-400">
                <FiActivity className="mx-auto text-4xl mb-3 text-blue-200" />
                <p>No hospitals registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">#</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Hospital</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Email</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Doctor</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Location</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Status</th>
                      <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wide">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {hospitals.map((h, i) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                              {h.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold">{h.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{h.email}</td>
                        <td className="px-6 py-4 text-slate-500">{h.doctor_name || '—'}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{[h.city, h.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-6 py-4">
                          {h.is_approved ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                              <FiCheckCircle /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                              <FiClock /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && !loading && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl p-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FiHeart className="text-red-500" /> Recent Blood Banks</h3>
              <div className="space-y-3">
                {bloodbanks.slice(0, 5).map((bb) => (
                  <div key={bb.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {bb.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="font-semibold text-sm truncate">{bb.name}</div>
                      <div className="text-xs text-slate-400 truncate">{bb.email}</div>
                    </div>
                    {bb.is_approved ? (
                      <FiCheckCircle className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <FiClock className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {bloodbanks.length === 0 && <p className="text-slate-400 text-sm">No blood banks yet</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl p-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FiActivity className="text-blue-500" /> Recent Hospitals</h3>
              <div className="space-y-3">
                {hospitals.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {h.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="font-semibold text-sm truncate">{h.name}</div>
                      <div className="text-xs text-slate-400 truncate">{h.email}</div>
                    </div>
                    {h.is_approved ? (
                      <FiCheckCircle className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <FiClock className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {hospitals.length === 0 && <p className="text-slate-400 text-sm">No hospitals yet</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
