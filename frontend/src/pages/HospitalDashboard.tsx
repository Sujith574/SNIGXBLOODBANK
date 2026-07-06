import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiActivity, 
  FiCheckSquare, 
  FiHeart,
  FiFileText,
  FiPlusCircle
} from 'react-icons/fi';

interface RequestItem {
  id: string;
  patient_name: string;
  blood_group: string;
  units_required: number;
  emergency_level: string;
  reason: string;
  required_date: string;
  doctor_name: string;
  status: string;
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Request form state
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [requestGroup, setRequestGroup] = useState('A+');
  const [unitsRequired, setUnitsRequired] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState('low');
  const [reason, setReason] = useState('');
  const [requiredDate, setRequiredDate] = useState('');

  const [message, setMessage] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('Publishing emergency request...');
      const res = await api.post('/blood-requests', {
        patientName,
        age: Number(age),
        gender,
        bloodGroup: requestGroup,
        unitsRequired: Number(unitsRequired),
        doctorName,
        emergencyLevel,
        reason,
        requiredDate
      });
      if (res.data?.success) {
        setMessage('Emergency request broadcasted to all Blood Banks!');
        setPatientName('');
        setAge('');
        setUnitsRequired('');
        setDoctorName('');
        setReason('');
        setRequiredDate('');
        fetchStats();
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error publishing request');
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

  const requests: RequestItem[] = stats?.requests || [];
  const isApproved = stats?.hospitalInfo?.is_approved ?? false;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              Hospital Portal: {user?.name || 'Clinic'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Submit patient requirements and track live dispatches from linked Blood Banks.
            </p>
          </div>

          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
            isApproved 
              ? 'border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-400'
              : 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            <FiCheckSquare className="text-xl" />
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-85">Licensing Approval</div>
              <div className="font-extrabold text-sm capitalize">{isApproved ? 'Verified' : 'Pending Review'}</div>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3.5 bg-red-500/5 border border-red-500/15 rounded-2xl text-xs font-bold text-center text-red-600 dark:text-red-400">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create Request Form */}
          <div className="lg:col-span-4">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-md font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4">
                <FiPlusCircle className="text-red-500" />
                <span>New Patient Request Form</span>
              </h3>
              <form onSubmit={handleCreateRequest} className="space-y-3">
                <input
                  type="text"
                  placeholder="Patient Full Name"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Age"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={requestGroup}
                    onChange={(e) => setRequestGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    {bloodGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Units Required"
                    required
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Attending Doctor"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />

                <select
                  value={emergencyLevel}
                  onChange={(e) => setEmergencyLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>

                <input
                  type="text"
                  placeholder="Reason / Diagnosis"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Required Date</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all cursor-pointer"
                >
                  Publish Emergency Request
                </button>
              </form>
            </div>
          </div>

          {/* View My Requests Board */}
          <div className="lg:col-span-8">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-400 dark:text-slate-350 uppercase tracking-wider mb-6">
                <FiFileText className="text-red-500" />
                <span>Active Blood Requests & Fulfillments</span>
              </h3>

              {requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-light text-sm">
                  You have not created any patient requests yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => (
                    <div 
                      key={r.id}
                      className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-850 dark:text-white">{r.patient_name}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                            r.emergency_level === 'high'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                          }`}>
                            {r.emergency_level}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-light">
                          Diagnosis: {r.reason} • Attending: {r.doctor_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-500">{r.blood_group}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{r.units_required} Units Remaining</div>
                        </div>
                        <div className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wide border ${
                          r.status === 'completed' 
                            ? 'bg-green-500/15 border-green-500/20 text-green-600 dark:text-green-400' 
                            : 'bg-yellow-500/15 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {r.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
