import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader2, ArrowLeft, CheckCircle, FileText, Pill, AlertCircle } from 'lucide-react';

const Consultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAppt = async () => {
      try {
        const res = await api.get('/doctor/appointments');
        const appt = res.data.find(a => a.id === parseInt(id));
        if (!appt) {
          setError('Appointment not found.');
        } else if (appt.status !== 'BOOKED') {
          setError('This appointment is already completed or cancelled.');
        } else {
          setAppointment(appt);
        }
      } catch (err) {
        setError('Failed to load appointment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppt();
  }, [id]);

  const handleSubmit = async () => {
    if (!notes.trim() || !prescription.trim()) {
      return setError('Please provide both clinical notes and a prescription.');
    }
    
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/doctor/appointments/${id}/consultation`, {
        notes: notes,
        prescription: prescription
      });
      setSuccess(true);
      setTimeout(() => navigate('/doctor'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (success) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg mx-auto mt-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Consultation Completed!</h2>
        <p className="text-slate-600 mb-6">The clinical notes have been saved and the AI post-visit summary is being generated.</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-800 font-medium mb-6">{error}</p>
        <button onClick={() => navigate('/doctor')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/doctor')} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Consultation: {appointment.patient_name}</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Info Card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Details</h3>
            <p className="font-semibold text-slate-900 mb-1">{appointment.patient_name}</p>
            <p className="text-sm text-slate-600 mb-4">{new Date(appointment.appointment_date).toLocaleDateString()} @ {appointment.start_time.substring(0,5)}</p>
            
            <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Symptoms</h4>
            <p className="text-sm text-slate-700">{appointment.symptoms}</p>
          </div>

          {/* AI Pre-visit Summary */}
          {appointment.ai_previsit_summary && (
            <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">AI Analysis</h3>
              <div className="mb-4">
                <p className="text-sm text-slate-700">{appointment.ai_previsit_summary}</p>
              </div>
              {appointment.urgency_level && (
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Urgency</span>
                  <span className="text-sm font-semibold text-sky-800">{appointment.urgency_level}</span>
                </div>
              )}
              {appointment.chief_complaint && (
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Chief Complaint</span>
                  <p className="text-sm text-slate-700">{appointment.chief_complaint}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
              <FileText className="w-4 h-4 text-primary" /> Clinical Notes
            </label>
            <textarea
              rows={6}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter consultation findings, diagnosis, and instructions..."
              className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-primary focus:border-primary sm:text-sm resize-none bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
              <Pill className="w-4 h-4 text-primary" /> Prescription
            </label>
            <textarea
              rows={4}
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
              placeholder="E.g. Paracetamol 500mg twice daily for 3 days"
              className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-primary focus:border-primary sm:text-sm resize-none bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Complete Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
