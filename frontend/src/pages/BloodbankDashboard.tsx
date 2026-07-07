import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiHeart, 
  FiUserPlus, 
  FiActivity, 
  FiLayers, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiList
} from 'react-icons/fi';

interface Request {
  id: string;
  patient_name: string;
  blood_group: string;
  units_required: number;
  emergency_level: 'low' | 'medium' | 'high';
  reason: string;
  required_date: string;
  doctor_name: string;
}

interface DonorRecord {
  id: string;
  phone: string;
  gender: string;
  weight_kg: number;
  blood_group: string;
  date_of_birth: string;
  city: string;
}

export default function BloodbankDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Donor Intake Form State
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorGender, setDonorGender] = useState('male');
  const [donorWeight, setDonorWeight] = useState('');
  const [donorGroup, setDonorGroup] = useState('A+');
  const [donorDob, setDonorDob] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donorCity, setDonorCity] = useState('');
  const [donorState, setDonorState] = useState('');
  const [donorPincode, setDonorPincode] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Stock inventory Adjust Form State
  const [invGroup, setInvGroup] = useState('A+');
  const [invUnits, setInvUnits] = useState('');

  // Fulfill dialog State
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [unitsToFulfill, setUnitsToFulfill] = useState('');

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

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('Saving donor record...');
      const res = await api.post('/donors/create', {
        name: donorName,
        phone: donorPhone,
        gender: donorGender,
        weightKg: Number(donorWeight),
        bloodGroup: donorGroup,
        dateOfBirth: donorDob,
        address: donorAddress,
        city: donorCity,
        state: donorState,
        pincode: donorPincode,
        medicalHistory
      });

      if (res.data?.success) {
        setMessage('Blood Donor registered successfully!');
        setDonorName('');
        setDonorPhone('');
        setDonorWeight('');
        setDonorDob('');
        setDonorAddress('');
        setDonorCity('');
        setDonorState('');
        setDonorPincode('');
        setMedicalHistory('');
        fetchStats();
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error occurred recording donor');
    }
  };

  const handleInventoryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage('Updating inventory stock...');
      const res = await api.post('/blood-inventory', {
        bloodGroup: invGroup,
        units: Number(invUnits)
      });
      if (res.data?.success) {
        setMessage('Inventory stock updated successfully!');
        setInvUnits('');
        fetchStats();
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed updating stock');
    }
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setMessage('Providing blood units...');
      const res = await api.post('/blood-requests/fulfill', {
        requestId: selectedRequest.id,
        unitsProvided: Number(unitsToFulfill),
        bloodGroup: selectedRequest.blood_group
      });

      if (res.data?.success) {
        setMessage(`Provided ${unitsToFulfill} units of ${selectedRequest.blood_group} successfully!`);
        setSelectedRequest(null);
        setUnitsToFulfill('');
        fetchStats();
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Fulfillment request failed');
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

  const inventory = stats?.inventory || [];
  const requests: Request[] = stats?.requests || [];
  const donors: DonorRecord[] = stats?.donors || [];

  // Stock Map
  const stockMap: Record<string, number> = {};
  bloodGroups.forEach((g) => {
    stockMap[g] = inventory.find((i: any) => i.blood_group === g)?.units_available || 0;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            {user?.name || 'Blood Bank Terminal'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Store volunteer donor records, manage storage stock levels, and provide units to incoming hospital requests.
          </p>
        </div>

        {/* Global Inventory Board */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <h3 className="text-sm font-black flex items-center gap-2 text-slate-400 dark:text-slate-350 uppercase tracking-wider mb-6">
            <FiLayers className="text-red-500" />
            <span>Blood Stock Inventory (Units Available)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {bloodGroups.map((group) => {
              const count = stockMap[group];
              const isLow = count < 5;
              return (
                <div 
                  key={group}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center ${
                    isLow 
                      ? 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400' 
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider opacity-70">{group}</span>
                  <span className="text-3xl font-black mt-1">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {message && (
          <div className="p-3.5 bg-red-500/5 border border-red-500/15 rounded-2xl text-xs font-bold text-center text-red-600 dark:text-red-400">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Intake / Forms forms */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Donor intake card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-md font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4">
                <FiUserPlus className="text-red-500" />
                <span>Donor Intake Register</span>
              </h3>
              <form onSubmit={handleRegisterDonor} className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />

                <input
                  type="text"
                  placeholder="Contact Phone Number"
                  required
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={donorGender}
                    onChange={(e) => setDonorGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    required
                    value={donorWeight}
                    onChange={(e) => setDonorWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    {bloodGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input
                    type="date"
                    required
                    value={donorDob}
                    onChange={(e) => setDonorDob(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Address Line"
                  required
                  value={donorAddress}
                  onChange={(e) => setDonorAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={donorCity}
                    onChange={(e) => setDonorCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px]"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={donorState}
                    onChange={(e) => setDonorState(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px]"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    required
                    value={donorPincode}
                    onChange={(e) => setDonorPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px]"
                  />
                </div>

                <textarea
                  placeholder="Medical history remarks..."
                  rows={2}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save Donor Record
                </button>
              </form>
            </div>

            {/* Adjust stock card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-md font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4">
                <FiLayers className="text-red-500" />
                <span>Adjust Stock Levels</span>
              </h3>
              <form onSubmit={handleInventoryUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group</label>
                    <select
                      value={invGroup}
                      onChange={(e) => setInvGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    >
                      {bloodGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Units</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={invUnits}
                      onChange={(e) => setInvUnits(e.target.value)}
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

          </div>

          {/* Incoming Hospital Requests feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live requests */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-400 dark:text-slate-350 uppercase tracking-wider mb-6">
                <FiActivity className="text-red-500" />
                <span>Live Incoming Hospital Blood Requests</span>
              </h3>

              {requests.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-light text-sm">
                  No active hospital requests published currently.
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
                          <span className="font-bold text-slate-850 dark:text-white">{r.patient_name} ({r.reason})</span>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                            r.emergency_level === 'high'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                          }`}>
                            {r.emergency_level}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Attending Doctor: {r.doctor_name} • Required by: {new Date(r.required_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-500">{r.blood_group}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{r.units_required} units</div>
                        </div>
                        <button 
                          onClick={() => setSelectedRequest(r)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10"
                        >
                          Give Blood
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Donor intake records list table */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-400 dark:text-slate-350 uppercase tracking-wider mb-4">
                <FiList className="text-red-500" />
                <span>Registered Donor Intake Directory</span>
              </h3>

              {donors.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-light text-sm">
                  No volunteer donor records registered at this location.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                        <th className="py-2.5">Blood Group</th>
                        <th className="py-2.5">Phone</th>
                        <th className="py-2.5">Gender</th>
                        <th className="py-2.5">Weight</th>
                        <th className="py-2.5">DOB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donors.map((d, index) => (
                        <tr key={index} className="border-b border-slate-50 dark:border-slate-900 last:border-0">
                          <td className="py-2.5 font-bold text-red-500">{d.blood_group}</td>
                          <td className="py-2.5 font-medium">{d.phone}</td>
                          <td className="py-2.5 capitalize">{d.gender}</td>
                          <td className="py-2.5">{d.weight_kg} kg</td>
                          <td className="py-2.5">{new Date(d.date_of_birth).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Fulfill Request Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-850 rounded-3xl p-6 shadow-2xl relative">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
                Provide Blood Units to Hospital
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Fulfilling request for <strong>{selectedRequest.patient_name}</strong>. Group: <strong className="text-red-500">{selectedRequest.blood_group}</strong> (Required: {selectedRequest.units_required} units).
              </p>

              <form onSubmit={handleFulfillSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Units to Provide
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedRequest.units_required}
                    required
                    placeholder="Enter quantity"
                    value={unitsToFulfill}
                    onChange={(e) => setUnitsToFulfill(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
