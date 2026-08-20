import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, Clock, Loader2, Activity, User, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DoctorHome = () => {
  const { user } = useAuth();
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
        
        // Sort upcoming first
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

  const getUrgencyColor = (level) => {
    if (level === 'High') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'Medium') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 'Low') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dr. {user.name}'s Schedule</h2>
        {calendarUrl && (
          <a href={calendarUrl} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <LinkIcon className="w-4 h-4 text-primary" /> Connect Calendar
          </a>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>}

      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">You have no appointments scheduled.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                appt.status === 'BOOKED' ? 'bg-primary' : 
                appt.status === 'COMPLETED' ? 'bg-green-500' : 'bg-slate-300'
              }`}></div>

              <div className="pl-4 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-full"><User className="w-5 h-5 text-slate-600" /></div>
                      <h3 className="text-lg font-bold text-slate-900">{appt.patient_name}</h3>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      appt.status === 'BOOKED' ? 'bg-sky-100 text-sky-800' : 
                      appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(appt.appointment_date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {appt.start_time.substring(0,5)}</div>
                  </div>

                  {appt.symptoms && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4" /> Symptoms</p>
                      <p className="text-sm text-slate-600 mt-1">{appt.symptoms}</p>
                    </div>
                  )}

                  {appt.ai_previsit_summary && (
                    <div className="mt-4 bg-sky-50 p-4 rounded-xl border border-sky-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-primary">AI Pre-Visit Analysis</p>
                        {appt.urgency_level && (
                          <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getUrgencyColor(appt.urgency_level)}`}>
                            {appt.urgency_level.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {appt.chief_complaint && (
                        <p className="text-sm text-slate-700 mb-2"><strong>Chief Complaint:</strong> {appt.chief_complaint}</p>
                      )}
                      {appt.suggested_questions && appt.suggested_questions.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Suggested Questions:</p>
                          <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                            {appt.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      )}
                      {!appt.chief_complaint && (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{appt.ai_previsit_summary}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center">
                  {appt.status === 'BOOKED' && (
                    <Link
                      to={`/doctor/consultation/${appt.id}`}
                      className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                      Start Consultation
                    </Link>
                  )}
                  {appt.status === 'COMPLETED' && (
                    <button disabled className="px-6 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium cursor-not-allowed">
                      Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorHome;
