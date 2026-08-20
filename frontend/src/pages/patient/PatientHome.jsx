import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CalendarPlus, Calendar as CalendarIcon, Clock, Link as LinkIcon, ChevronRight, CheckCircle2, Activity, User, CalendarDays } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const PatientHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [calendarUrl, setCalendarUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [apptRes, calRes] = await Promise.all([
          api.get('/patient/appointments'),
          api.get('/calendar/auth').catch(() => ({ data: { url: null } }))
        ]);
        setAppointments(apptRes.data);
        if (calRes.data?.url) setCalendarUrl(calRes.data.url);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingAppts = appointments
    .filter(a => {
      const apptDateStr = a.appointment_date.split('T')[0];
      return a.status === 'BOOKED' && new Date(`${apptDateStr}T${a.start_time}`) >= new Date();
    })
    .sort((a, b) => {
      const dateA = a.appointment_date.split('T')[0];
      const dateB = b.appointment_date.split('T')[0];
      return new Date(`${dateA}T${a.start_time}`) - new Date(`${dateB}T${b.start_time}`);
    });

  const nextAppt = upcomingAppts[0];
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;
  const upcomingCount = upcomingAppts.length;
  const totalCount = appointments.length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-main">{greeting}, {user?.name} 👋</h1>
        <p className="text-muted mt-1 text-sm">Manage your appointments and stay on top of your healthcare.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Compact Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="p-4" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main leading-none mb-1">{upcomingCount}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Upcoming</p>
          </div>
        </Card>
        
        <Card padding="p-4" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main leading-none mb-1">{completedCount}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Completed</p>
          </div>
        </Card>

        <Card padding="p-4" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main leading-none mb-1">{totalCount}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Visits</p>
          </div>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment — Primary */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1">Next Appointment</h2>
          {nextAppt ? (
            <Card padding="p-5" className="relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-main leading-tight">{nextAppt.doctor_name}</h3>
                    <p className="text-sm text-muted font-medium">{nextAppt.specialization}</p>
                  </div>
                </div>
                <Badge variant="info">UPCOMING</Badge>
              </div>
              
              <div className="mt-5 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted" />
                  <span className="text-sm font-medium text-main">
                    {new Date(nextAppt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted" />
                  <span className="text-sm font-medium text-main">
                    {nextAppt.start_time.substring(0,5)} - {nextAppt.end_time.substring(0,5)}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState 
              title="No upcoming appointments"
              description="You don't have any upcoming appointments scheduled."
              icon={CalendarIcon}
              className="h-full py-6"
            />
          )}
        </div>

        {/* Quick Actions — Secondary */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1">Quick Actions</h2>
          <Card padding="p-2" className="flex flex-col h-full justify-center">
            <Link to="/patient/book" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-main">Book Appointment</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
            </Link>
            
            <div className="h-px bg-border mx-3 my-1" />
            
            <Link to="/patient/appointments" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-main">My Appointments</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Google Calendar Integration */}
      {calendarUrl && (
        <div className="flex flex-col gap-3 mt-2">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider px-1">Integrations</h2>
          <Card padding="p-4" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-primary flex-shrink-0">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-main text-sm">Connect Google Calendar</h3>
                <p className="text-xs text-muted">Sync your HealthSync appointments securely with Google Calendar.</p>
              </div>
            </div>
            <a href={calendarUrl} className="w-full sm:w-auto shrink-0">
              <Button variant="outline" className="w-full sm:w-auto text-xs py-1.5 h-8 gap-2">
                <LinkIcon className="w-3.5 h-3.5" />
                Connect Calendar
              </Button>
            </a>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PatientHome;
