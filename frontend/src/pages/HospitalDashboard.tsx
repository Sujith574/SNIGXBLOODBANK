import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiLayers, 
  FiPlusCircle, 
  FiInbox, 
  FiActivity, 
  FiCheckSquare, 
  FiHeart 
} from 'react-icons/fi';

interface InventoryItem {
  blood_group: string;
  units_available: number;
}

interface RequestItem {
  id: string;
  patient_name: string;
  blood_group: string;
  units_required: number;
  emergency_level: string;
  reason: string;
  required_date: string;
  status: string;
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Inventory update form
  const [targetGroup, setTargetGroup] = useState('A+');
  const [targetUnits, setTargetUnits] = useState(0);

  // Request form
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

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('Updating stock...');
      const res = await api.post('/blood-inventory', {
        bloodGroup: targetGroup,
        units: Number(targetUnits)
      });
      if (res.data?.success) {
        setMessage('Stock inventory updated successfully!');
        setTargetUnits(0);
        fetchStats();
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error updating stock inventory');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('Publishing request...');
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
        setMessage('Emergency request published successfully!');
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

  const inventory: InventoryItem[] = stats?.inventory || [];
  const requests: RequestItem[] = stats?.requests || [];
  const isApproved = stats?.hospitalInfo?.is_approved || false;

  // Build key-value mapping of stock
  const stockMap: Record<string, number> = {};
  bloodGroups.forEach((g) => {
    stockMap[g] = inventory.find((i) => i.blood_group === g)?.units_available || 0;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              {user?.name || 'Hospital Center'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage stock levels, publish emergency alerts, and coordinate compatibility matching.
            </p>
          </div>

          {/* Registration status */}
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
            isApproved 
              ? 'border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-400' 
              : 'border-yellow-500/25 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          }`}>
            <FiCheckSquare className="text-xl" />
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-85">Licensing Approval</div>
              <div className="font-extrabold text-sm capitalize">{isApproved ? 'Verified' : 'Pending Admin Verification'}</div>
            </div>
          </div>
        </div>

        {/* Blood Stock Inventory Grid */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6">
            <FiLayers className="text-red-500" />
            <span>Real-time Blood Stock Inventory (Units Available)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {bloodGroups.map((group) => {
              const count = stockMap[group];
              const isLow = count < 5;
              return (
                <div 
                  key={group}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center ${
                    isLow 
                      ? 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400' 
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider opacity-70">{group}</span>
                  <span className="text-3xl font-black mt-1">{count}</span>
                  {isLow && <span className="text-[9px] uppercase font-bold mt-1 text-red-500 animate-pulse">Critical Stock</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Double Column layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Quick stock update & Publish Emergency requests forms */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Stock update card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-md font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4">
                <FiPlusCircle className="text-red-500" />
                <span>Adjust Stock Levels</span>
              </h3>
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group</label>
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    >
                      {bloodGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Available Units</label>
                    <input
                      type="number"
                      min="0"
                      value={targetUnits}
                      onChange={(e) => setTargetUnits(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Apply Stock Update
                </button>
              </form>
            </div>

            {/* Create Emergency Request Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-md font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4">
                <FiHeart className="text-red-500" />
                <span>Publish Blood Request</span>
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
                  disabled={!isApproved}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isApproved ? 'Broadcast Emergency Alert' : 'Licensing Pending Verification'}
                </button>
              </form>
            </div>

            {message && (
              <div className="text-xs font-bold text-center text-red-500 py-1 bg-red-500/5 rounded-xl border border-red-500/10">{message}</div>
            )}

          </div>

          {/* Live Request Broadcast details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6">
                <FiActivity className="text-red-500" />
                <span>Your Active Request Broadcasts</span>
              </h3>

              {requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-light text-sm">
                  You have not published any blood requests yet.
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
                          <span className="font-bold text-slate-800 dark:text-white">{r.patient_name}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                            r.emergency_level === 'high'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                          }`}>
                            {r.emergency_level}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-light">
                          Attending Doctor: {r.doctor_name} • Reason: {r.reason}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-500">{r.blood_group}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{r.units_required} Units</div>
                        </div>
                        <div className="px-3 py-1 bg-yellow-500/15 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-lg uppercase tracking-wide">
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
