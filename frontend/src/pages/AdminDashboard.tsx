import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { api } from '../utils/api';
import { 
  FiShield, 
  FiUsers, 
  FiFileText, 
  FiLayers, 
  FiCheckCircle, 
  FiXCircle 
} from 'react-icons/fi';

interface HospitalItem {
  id: string;
  registration_number: string;
  license_number: string;
  doctor_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_approved: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (hospitalId: string) => {
    try {
      setMessage('Approving hospital...');
      const res = await api.post('/admin/approve-hospital', { hospitalId });
      if (res.data?.success) {
        setMessage('Hospital verified and approved successfully!');
        fetchStats();
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Approval failed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const unapprovedHospitals: HospitalItem[] = stats?.unapprovedHospitals || [];
  const totalUsersCount = stats?.totalUsersCount || 0;
  const totalRequestsCount = stats?.totalRequestsCount || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            System Administration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Oversee registrations, approve licensing requests, and review global statistics.
          </p>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
            <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
              <FiUsers className="text-2xl" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Registered Users</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">{totalUsersCount}</div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
            <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
              <FiFileText className="text-2xl" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Blood Broadcasts</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">{totalRequestsCount}</div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
            <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
              <FiShield className="text-2xl" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Pending Verifications</div>
              <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">{unapprovedHospitals.length}</div>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs font-bold text-center text-red-500">{message}</div>
        )}

        {/* Hospital Approval Request Section */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6">
            <FiShield className="text-red-500" />
            <span>Licensing Approval Queue</span>
          </h3>

          {unapprovedHospitals.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-light text-sm">
              All registered facilities verified and approved. Queue empty.
            </div>
          ) : (
            <div className="space-y-4">
              {unapprovedHospitals.map((h) => (
                <div 
                  key={h.id}
                  className="p-5 bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-slate-800 dark:text-white text-base">Facility Details</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-400 font-medium">
                      <div>Reg No: <span className="font-bold text-slate-600 dark:text-slate-300">{h.registration_number}</span></div>
                      <div>License No: <span className="font-bold text-slate-600 dark:text-slate-300">{h.license_number}</span></div>
                      <div>Doctor-in-charge: <span className="font-bold text-slate-600 dark:text-slate-300">{h.doctor_name}</span></div>
                      <div>Phone: <span className="font-bold text-slate-600 dark:text-slate-300">{h.phone}</span></div>
                    </div>
                    <div className="text-xs text-slate-500 font-light">Location: {h.address}, {h.city}, {h.state} - {h.pincode}</div>
                  </div>

                  <button
                    onClick={() => handleApprove(h.id)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    Verify & Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
