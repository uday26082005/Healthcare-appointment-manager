import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, Clock, FileText, Activity, CalendarPlus, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Map appointment status to Badge variant
const statusVariant = (status) => {
  if (status === 'BOOKED') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'error';
  return 'neutral';
};

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Reschedule states — preserved exactly
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

  const upcomingAppts = appointments.filter(a => a.status === 'BOOKED');
  const pastAppts = appointments.filter(a => a.status !== 'BOOKED');

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="w-full pb-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-main">My Appointments</h1>
        <p className="text-muted mt-1 text-sm">View and manage your upcoming and past appointments.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Upcoming Appointments */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-main uppercase tracking-wider">Upcoming Appointments</h2>
          {upcomingAppts.length > 0 && (
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {upcomingAppts.length}
            </span>
          )}
        </div>

        {upcomingAppts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming appointments"
            description="You don't have any upcoming appointments scheduled."
            action={
              <Link to="/patient/book">
                <Button variant="primary" className="gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  Book an Appointment
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {upcomingAppts.map(appt => (
              <Card key={appt.id} padding="p-0" className="overflow-hidden relative">
                {/* Status bar */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

                <div className="p-5 pl-7">
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-main leading-tight">{appt.doctor_name}</h3>
                        <p className="text-sm text-muted">{appt.specialization}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(appt.status)}>{appt.status}</Badge>
                  </div>

                  {/* Date / Time row */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium text-main">
                        {new Date(appt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-main">
                        {appt.start_time.substring(0,5)} – {appt.end_time.substring(0,5)}
                      </span>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {appt.symptoms && (
                    <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Activity className="w-3.5 h-3.5" /> Symptoms
                      </p>
                      <p className="text-sm text-main">{appt.symptoms}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      variant="outline"
                      className="text-sm gap-2"
                      onClick={() => {
                        setRescheduleId(appt.id);
                        setNewDate('');
                        setRescheduleSlot(null);
                        setAvailableSlots([]);
                        setSlotError('');
                      }}
                    >
                      <Clock className="w-4 h-4" />
                      Reschedule
                    </Button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors px-4 py-2 text-sm h-10 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading === appt.id}
                      onClick={() => handleCancel(appt.id)}
                    >
                      {actionLoading === appt.id ? (
                        <LoadingSpinner size="sm" />
                      ) : null}
                      Cancel
                    </button>
                  </div>

                  {/* Inline Reschedule Panel */}
                  {rescheduleId === appt.id && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-border">
                      <h4 className="text-sm font-bold text-main mb-3">Reschedule Appointment</h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={newDate}
                          onChange={(e) => fetchSlots(appt.doctor_id, e.target.value)}
                          className="px-3 py-2 border border-border rounded-lg text-sm flex-grow focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface"
                        />
                        <select
                          value={rescheduleSlot ? rescheduleSlot.start : ''}
                          onChange={(e) => {
                            const slot = availableSlots.find(s => s.start === e.target.value);
                            setRescheduleSlot(slot);
                          }}
                          className="px-3 py-2 border border-border rounded-lg text-sm flex-grow focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface"
                        >
                          <option value="">-- Select Slot --</option>
                          {availableSlots.map((s, i) => (
                            <option key={i} value={s.start}>{s.start.substring(0,5)}</option>
                          ))}
                        </select>
                        <Button
                          variant="primary"
                          className="text-sm"
                          disabled={actionLoading === appt.id || !newDate || !rescheduleSlot}
                          onClick={() => handleReschedule(appt.id)}
                        >
                          {actionLoading === appt.id ? <LoadingSpinner size="sm" className="text-white" /> : 'Confirm'}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-sm"
                          onClick={() => setRescheduleId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                      {slotError && <p className="text-xs text-error mt-2">{slotError}</p>}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Appointments */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-muted uppercase tracking-wider">Past Appointments</h2>
          {pastAppts.length > 0 && (
            <span className="text-xs font-bold bg-slate-100 text-muted px-2.5 py-0.5 rounded-full">
              {pastAppts.length}
            </span>
          )}
        </div>

        {pastAppts.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No past appointments"
            description="Your completed and cancelled appointments will appear here."
          />
        ) : (
          <div className="space-y-3">
            {pastAppts.map(appt => {
              const barColor =
                appt.status === 'COMPLETED' ? 'bg-success' : 'bg-error';

              return (
                <Card key={appt.id} padding="p-0" className="overflow-hidden relative opacity-90">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${barColor}`} />

                  <div className="p-5 pl-7">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-main leading-tight">{appt.doctor_name}</h3>
                        <p className="text-sm text-muted">{appt.specialization}</p>
                      </div>
                      <Badge variant={statusVariant(appt.status)}>{appt.status}</Badge>
                    </div>

                    {/* Date / Time row */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{appt.start_time.substring(0,5)} – {appt.end_time.substring(0,5)}</span>
                      </div>
                    </div>

                    {/* COMPLETED — AI summary + prescription */}
                    {appt.status === 'COMPLETED' && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {appt.ai_postvisit_summary && (
                          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                            <p className="text-xs font-bold text-primary flex items-center gap-2 mb-2 uppercase tracking-wider">
                              <FileText className="w-3.5 h-3.5" /> AI Visit Summary
                            </p>
                            <p className="text-sm text-main whitespace-pre-wrap">{appt.ai_postvisit_summary}</p>
                          </div>
                        )}
                        {appt.prescription && (
                          <div className="bg-surface p-4 rounded-xl border border-border">
                            <p className="text-xs font-bold text-main mb-2 uppercase tracking-wider">Prescription</p>
                            <p className="text-sm text-muted whitespace-pre-wrap">{appt.prescription}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyAppointments;
