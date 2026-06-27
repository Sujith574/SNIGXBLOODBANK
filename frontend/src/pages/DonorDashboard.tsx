import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiHeart, 
  FiCalendar, 
  FiActivity, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle 
} from 'react-icons/fi';

interface Request {
  id: string;
  patient_name: string;
  blood_group: string;
  units_required: number;
  emergency_level: 'low' | 'medium' | 'high';
  reason: string;
  required_date: string;
}

interface Appointment {
  id: string;
  appointment_date_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  note?: string;
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [message, setMessage] = useState('');

  // Sample static hospitals for donation booking (normally fetched from API)
  const hospitals = [
    { id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', name: 'Metro General Hospital' },
    { id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', name: 'City Red Cross Center' }
  ];

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

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !hospitalId) return;

    try {
      setMessage('Booking slot...');
      const res = await api.post('/appointments', {
        hospitalId,
        dateTime: new Date(bookingDate).toISOString(),
        note: bookingNote
      });
      if (res.data?.success) {
        setMessage('Appointment booked successfully!');
        setBookingDate('');
        setBookingNote('');
        fetchStats();
      } else {
        setMessage('Failed to book appointment.');
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error occurred booking appointment');
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

  const eligibility = stats?.eligibility?.eligibility_status || 'eligible';
  const requests: Request[] = stats?.requests || [];
  const appointments: Appointment[] = stats?.appointments || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              Hello, {user?.name || 'Donor'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Welcome back to your Smart Blood Bank dashboard.
            </p>
          </div>

          {/* Eligibility Indicator */}
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
            eligibility === 'eligible'
              ? 'border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-400'
              : 'border-yellow-500/25 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          }`}>
            {eligibility === 'eligible' ? <FiCheckCircle className="text-xl" /> : <FiAlertTriangle className="text-xl" />}
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-85">Eligibility Status</div>
              <div className="font-extrabold text-sm capitalize">{eligibility.replace('_', ' ')}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Booking Slots card */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6">
              <FiCalendar className="text-red-500" />
              <span>Book Appointment</span>
            </h3>

            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Select Blood Center/Hospital
                </label>
                <select
                  required
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <option value="">-- Choose Facility --</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notes / Health remarks
                </label>
                <textarea
                  placeholder="E.g. Fasting, first time donor..."
                  rows={3}
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                />
              </div>

              {message && (
                <div className="text-xs font-bold text-center text-red-500 py-1">{message}</div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all cursor-pointer"
              >
                Schedule Donation Slot
              </button>
            </form>
          </div>

          {/* Active Blood Requests feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Requests Feed */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6">
                <FiActivity className="text-red-500" />
                <span>Compatible Blood Requests</span>
              </h3>

              {requests.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-light text-sm">
                  No active blood requests currently matching your criteria.
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
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                            r.emergency_level === 'high'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                          }`}>
                            {r.emergency_level} emergency
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-light">
                          Reason: {r.reason} • Needed by: {new Date(r.required_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-500">{r.blood_group}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{r.units_required} units</div>
                        </div>
                        <button 
                          onClick={() => alert('Response registered. The hospital has been notified!')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10"
                        >
                          Donate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Appointments logs */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6">
                <FiClock className="text-red-500" />
                <span>Your Appointments</span>
              </h3>

              {appointments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-light text-sm">
                  You have no scheduled appointments.
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((a) => (
                    <div 
                      key={a.id} 
                      className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <FiCalendar className="text-slate-400" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {new Date(a.appointment_date_time).toLocaleString()}
                          </div>
                          {a.note && <div className="text-xs text-slate-400 truncate max-w-xs">{a.note}</div>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md ${
                        a.status === 'scheduled' 
                          ? 'bg-blue-500/10 text-blue-500' 
                          : a.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {a.status}
                      </span>
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
