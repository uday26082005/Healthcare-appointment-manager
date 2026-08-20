import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CalendarPlus, Calendar as CalendarIcon, Clock, Link as LinkIcon, Loader2 } from 'lucide-react';

const PatientHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [calendarUrl, setCalendarUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, calRes] = await Promise.all([
          api.get('/patient/appointments'),
          api.get('/calendar/auth').catch(() => ({ data: { url: null } }))
        ]);
        setAppointments(apptRes.data);
        if (calRes.data?.url) setCalendarUrl(calRes.data.url);
      } catch (err) {
        console.error(err);
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/patient/book" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-sky-50 hover:text-primary transition-colors text-slate-700 font-medium border border-slate-100">
              <CalendarPlus className="w-5 h-5 text-primary" />
              Book New Appointment
            </Link>
            <Link to="/patient/appointments" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-sky-50 hover:text-primary transition-colors text-slate-700 font-medium border border-slate-100">
              <Clock className="w-5 h-5 text-primary" />
              View Appointment History
            </Link>
            {calendarUrl && (
              <a href={calendarUrl} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-sky-50 hover:text-primary transition-colors text-slate-700 font-medium border border-slate-100">
                <LinkIcon className="w-5 h-5 text-primary" />
                Connect Google Calendar
              </a>
            )}
          </div>
        </div>

        {/* Next Appointment */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Next Appointment</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : nextAppt ? (
            <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900">{nextAppt.doctor_name}</p>
                  <p className="text-sm text-slate-600">{nextAppt.specialization}</p>
                </div>
                <span className="bg-sky-200 text-sky-800 text-xs px-2 py-1 rounded font-semibold">UPCOMING</span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-500" />
                  {new Date(nextAppt.appointment_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {nextAppt.start_time.substring(0,5)} - {nextAppt.end_time.substring(0,5)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No upcoming appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHome;
