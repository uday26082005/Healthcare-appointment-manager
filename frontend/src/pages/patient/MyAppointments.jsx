import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, FileText, Activity, AlertTriangle, Loader2, XCircle } from 'lucide-react';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores appointment ID

  // Reschedule states
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [slotError, setSlotError] = useState('');

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/patient/appointments');
      // Sort: Upcoming first, then completed, then cancelled
      const sorted = res.data.sort((a, b) => {
        if (a.status === 'BOOKED' && b.status !== 'BOOKED') return -1;
        if (a.status !== 'BOOKED' && b.status === 'BOOKED') return 1;
        return new Date(b.appointment_date) - new Date(a.appointment_date);
      });
      setAppointments(sorted);
    } catch (err) {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, dateVal) => {
    setNewDate(dateVal);
    setAvailableSlots([]);
    setRescheduleSlot(null);
    setSlotError('');
    if (!dateVal) return;
    try {
      const res = await api.get(`/patient/doctors/${doctorId}/slots?date=${dateVal}`);
      if (res.data.length === 0) setSlotError('No slots available for this date');
      setAvailableSlots(res.data);
    } catch (err) {
      setSlotError('Failed to fetch slots');
    }
  };

  const handleReschedule = async (id) => {
    if (!newDate || !rescheduleSlot) return;
    setActionLoading(id);
    try {
      await api.put(`/patient/appointments/${id}/reschedule`, {
        date: newDate,
        start_time: rescheduleSlot.start,
        end_time: rescheduleSlot.end
      });
      setRescheduleId(null);
      await fetchAppointments();
    } catch (err) {
      setSlotError(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setActionLoading(id);
    try {
      await api.put(`/patient/appointments/${id}/cancel`);
      await fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyColor = (level) => {
    if (level === 'High') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'Medium') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 'Low') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">My Appointments</h2>

      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Your upcoming appointments will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                appt.status === 'BOOKED' ? 'bg-primary' : 
                appt.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>

              <div className="pl-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{appt.doctor_name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      appt.status === 'BOOKED' ? 'bg-sky-100 text-sky-800' : 
                      appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(appt.appointment_date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {appt.start_time.substring(0,5)}</div>
                  </div>

                  {appt.symptoms && (
                    <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4" /> Symptoms Provided</p>
                      <p className="text-sm text-slate-600 mt-1">{appt.symptoms}</p>
                    </div>
                  )}

                  {/* AI & Clinical Details if COMPLETED */}
                  {appt.status === 'COMPLETED' && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      {appt.ai_postvisit_summary && (
                        <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                          <p className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" /> AI Visit Summary
                          </p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{appt.ai_postvisit_summary}</p>
                        </div>
                      )}
                      
                      {appt.prescription && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <p className="text-sm font-bold text-slate-800 mb-2">Prescription</p>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{appt.prescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col justify-start items-end gap-2">
                  {appt.status === 'BOOKED' && (
                    <>
                      <button
                        onClick={() => { setRescheduleId(appt.id); setNewDate(''); setRescheduleSlot(null); setAvailableSlots([]); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-100 w-full justify-center"
                      >
                        <Clock className="w-4 h-4" />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(appt.id)}
                        disabled={actionLoading === appt.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 disabled:opacity-50 w-full justify-center"
                      >
                        {actionLoading === appt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reschedule Modal/Inline form */}
              {rescheduleId === appt.id && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Reschedule Appointment</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newDate}
                      onChange={(e) => fetchSlots(appt.doctor_id, e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-grow"
                    />
                      <select
                        value={rescheduleSlot ? rescheduleSlot.start : ''}
                        onChange={(e) => {
                          const slot = availableSlots.find(s => s.start === e.target.value);
                          setRescheduleSlot(slot);
                        }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-grow"
                      >
                        <option value="">-- Select Slot --</option>
                        {availableSlots.map((s, i) => (
                          <option key={i} value={s.start}>{s.start.substring(0,5)}</option>
                        ))}
                      </select>
                    <button
                      onClick={() => handleReschedule(appt.id)}
                      disabled={actionLoading === appt.id || !newDate || !rescheduleSlot}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === appt.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setRescheduleId(null)}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {slotError && <p className="text-xs text-red-500 mt-2">{slotError}</p>}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
