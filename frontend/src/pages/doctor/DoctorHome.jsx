import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, Clock, Activity, User, Link as LinkIcon, Stethoscope, CheckCircle2, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const statusVariant = (status) => {
  if (status === 'BOOKED') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'error';
  return 'neutral';
};

const urgencyVariant = (level) => {
  if (level === 'High') return 'error';
  if (level === 'Medium') return 'warning';
  if (level === 'Low') return 'success';
  return 'neutral';
};

const DoctorHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarUrl, setCalendarUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, calRes] = await Promise.all([
          api.get('/doctor/appointments'),
          api.get('/calendar/auth').catch(() => ({ data: { url: null } }))
        ]);

        // Sort upcoming first, then by date
        const sorted = apptRes.data.sort((a, b) => {
          if (a.status === 'BOOKED' && b.status !== 'BOOKED') return -1;
          if (a.status !== 'BOOKED' && b.status === 'BOOKED') return 1;
          return new Date(a.appointment_date) - new Date(b.appointment_date);
        });
        setAppointments(sorted);
        if (calRes.data?.url) setCalendarUrl(calRes.data.url);
      } catch (err) {
        setError('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.appointment_date.split('T')[0] === today);
  const upcomingAppts = appointments.filter(a => a.status === 'BOOKED');
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');

  // Next booked appointment for Quick Actions shortcut
  const nextBookedAppt = upcomingAppts[0];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="w-full pb-8 space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-main">
          {greeting}, Dr. {user?.name} 👋
        </h1>
        <p className="text-sm text-muted mt-1">
          Here's your schedule and today's patient activity.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="p-4" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main leading-none mb-1">{todayAppts.length}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Today's Patients</p>
          </div>
        </Card>
        <Card padding="p-4" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-primary flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main leading-none mb-1">{upcomingAppts.length}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Upcoming</p>
          </div>
        </Card>
        <Card padding="p-4" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main leading-none mb-1">{completedAppts.length}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Completed</p>
          </div>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT: Appointment Schedule */}
        <div className="flex-1 min-w-0 space-y-4">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1">
            Today's Appointments
          </h2>

          {appointments.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No appointments scheduled"
              description="You don't have any appointments requiring attention right now."
            />
          ) : (
            <div className="space-y-3">
              {appointments.map(appt => {
                const isPast = appt.status !== 'BOOKED';
                const barColor =
                  appt.status === 'BOOKED' ? 'bg-primary' :
                  appt.status === 'COMPLETED' ? 'bg-success' : 'bg-slate-300';

                return (
                  <Card
                    key={appt.id}
                    padding="p-0"
                    className={`overflow-hidden relative${isPast ? ' opacity-80' : ''}`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${barColor}`} />

                    <div className="p-5 pl-7">
                      {/* Header: Patient + badges */}
                      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-main leading-tight">{appt.patient_name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted mt-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(appt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{appt.start_time.substring(0,5)} – {appt.end_time.substring(0,5)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {appt.urgency_level && (
                            <Badge variant={urgencyVariant(appt.urgency_level)}>
                              {appt.urgency_level.toUpperCase()}
                            </Badge>
                          )}
                          <Badge variant={statusVariant(appt.status)}>{appt.status}</Badge>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {appt.symptoms && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-main flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4" /> Symptoms
                          </p>
                          <p className="text-sm text-muted">{appt.symptoms}</p>
                        </div>
                      )}

                      {/* AI Pre-Visit Analysis */}
                      {appt.ai_previsit_summary ? (
                        <div className="mb-4 bg-sky-50 p-4 rounded-xl border border-sky-100">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-primary">AI Pre-Visit Analysis</p>
                            {appt.urgency_level && (
                              <Badge variant={urgencyVariant(appt.urgency_level)} size="sm">
                                {appt.urgency_level.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          {appt.chief_complaint && (
                            <p className="text-sm text-main mb-3">
                              <span className="font-semibold">Chief Complaint:</span> {appt.chief_complaint}
                            </p>
                          )}
                          {appt.suggested_questions && appt.suggested_questions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Suggested Questions:</p>
                              <ul className="list-disc pl-4 text-sm text-main space-y-1">
                                {appt.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
                              </ul>
                            </div>
                          )}
                          {!appt.chief_complaint && (
                            <p className="text-sm text-main whitespace-pre-wrap">{appt.ai_previsit_summary}</p>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-border text-sm text-muted italic">
                          AI summary is currently unavailable. Please review the original symptoms.
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex justify-end">
                        {appt.status === 'BOOKED' && (
                          <Link to={`/doctor/consultation/${appt.id}`}>
                            <Button variant="primary" className="gap-2">
                              <Stethoscope className="w-4 h-4" />
                              Start Consultation
                            </Button>
                          </Link>
                        )}
                        {appt.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Quick Actions + Next Up + Calendar */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-6">

          {/* Quick Actions — using real existing routes only */}
          <div>
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1 mb-3">Quick Actions</h2>
            <Card padding="p-2">
              {/* My Schedule → /doctor (the only doctor overview page) */}
              <button
                onClick={() => navigate('/doctor')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-main">My Schedule</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </button>

              <div className="h-px bg-border mx-3 my-1" />

              {/* Start Consultation → only navigable if there is a next booked appointment */}
              {nextBookedAppt ? (
                <button
                  onClick={() => navigate(`/doctor/consultation/${nextBookedAppt.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-main block">Next Consultation</span>
                      <span className="text-xs text-muted">{nextBookedAppt.patient_name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 opacity-50 cursor-default">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-muted">No upcoming consultations</span>
                </div>
              )}
            </Card>
          </div>

          {/* Next Up — compact list */}
          {upcomingAppts.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1 mb-3">Next Up</h2>
              <Card padding="p-4" className="space-y-3">
                {upcomingAppts.slice(0, 4).map(appt => (
                  <Link
                    key={appt.id}
                    to={`/doctor/consultation/${appt.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-main truncate group-hover:text-primary transition-colors">
                        {appt.patient_name}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {appt.start_time.substring(0,5)}
                      </p>
                    </div>
                  </Link>
                ))}
                {upcomingAppts.length > 4 && (
                  <p className="text-xs text-muted pl-4">+{upcomingAppts.length - 4} more upcoming</p>
                )}
              </Card>
            </div>
          )}

          {/* Google Calendar Integration */}
          {calendarUrl && (
            <div>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1 mb-3">Integrations</h2>
              <Card padding="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center text-primary flex-shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-main">Google Calendar</h3>
                    <p className="text-xs text-muted">Sync your schedule</p>
                  </div>
                </div>
                <a href={calendarUrl} className="block">
                  <Button variant="outline" className="w-full text-xs gap-1.5 h-8 py-1">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Connect Calendar
                  </Button>
                </a>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DoctorHome;
