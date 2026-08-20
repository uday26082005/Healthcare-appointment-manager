import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, CheckCircle, FileText, Pill, User, Calendar, Clock, Activity, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const urgencyVariant = (level) => {
  if (level === 'High') return 'error';
  if (level === 'Medium') return 'warning';
  if (level === 'Low') return 'success';
  return 'neutral';
};

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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (success) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Consultation Completed!"
        description="The clinical notes have been saved and the AI post-visit summary is being generated."
        className="mt-8 max-w-lg mx-auto"
      />
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-lg mx-auto mt-8 space-y-4">
        <Alert type="error" message={error || 'Appointment not found.'} />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => navigate('/doctor')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/doctor')}
          className="p-2 text-muted hover:text-main hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-main leading-tight">
            Consultation: {appointment.patient_name}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}
            {appointment.start_time.substring(0, 5)} – {appointment.end_time.substring(0, 5)}
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Two-column clinical workspace — grid-cols-5 gives 40/60 split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* LEFT COLUMN (2/5): Patient context */}
        <div className="lg:col-span-2 space-y-6">

          {/* Patient Information */}
          <Card padding="p-0" className="overflow-hidden">
            <div className="p-4 border-b border-border bg-slate-50">
              <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Patient Information</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-main leading-tight">{appointment.patient_name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{appointment.start_time.substring(0, 5)} – {appointment.end_time.substring(0, 5)}</span>
                </div>
              </div>

              {appointment.symptoms && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Activity className="w-3.5 h-3.5" /> Symptoms
                  </p>
                  <p className="text-sm text-main">{appointment.symptoms}</p>
                </div>
              )}
            </div>
          </Card>

          {/* AI Pre-Visit Analysis */}
          {appointment.ai_previsit_summary ? (
            <Card padding="p-0" className="overflow-hidden border-sky-200">
              <div className="p-4 border-b border-sky-100 bg-sky-50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Pre-Visit Analysis
                </h2>
                {appointment.urgency_level && (
                  <Badge variant={urgencyVariant(appointment.urgency_level)} size="sm">
                    {appointment.urgency_level.toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="p-5 bg-sky-50/30 space-y-4">
                {appointment.chief_complaint && (
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Chief Complaint</p>
                    <p className="text-sm font-medium text-main">{appointment.chief_complaint}</p>
                  </div>
                )}

                {appointment.suggested_questions && appointment.suggested_questions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Suggested Questions</p>
                    <ul className="space-y-2">
                      {appointment.suggested_questions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-main">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!appointment.chief_complaint && !appointment.suggested_questions?.length && (
                  <p className="text-sm text-main whitespace-pre-wrap">{appointment.ai_previsit_summary}</p>
                )}
              </div>
            </Card>
          ) : (
            <Card padding="p-5" className="border-dashed">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">AI Pre-Visit Analysis</p>
              <p className="text-sm text-muted italic">AI analysis is unavailable for this appointment. Please review the patient's reported symptoms above.</p>
            </Card>
          )}

          {/* Post-Visit AI Summary — shown only once it exists */}
          {appointment.ai_postvisit_summary && (
            <Card padding="p-0" className="overflow-hidden border-green-200">
              <div className="p-4 border-b border-green-100 bg-green-50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-success" />
                <h2 className="text-xs font-bold text-success uppercase tracking-wider">Post-Visit Summary</h2>
              </div>
              <div className="p-5 bg-green-50/30">
                <p className="text-sm text-main whitespace-pre-wrap">{appointment.ai_postvisit_summary}</p>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN (3/5): Doctor's workspace */}
        <div className="lg:col-span-3 space-y-6">

          {/* Clinical Notes */}
          <Card padding="p-0" className="overflow-hidden">
            <div className="p-4 border-b border-border bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-main">
                <FileText className="w-4 h-4 text-primary" />
                Clinical Notes
              </label>
              <p className="text-xs text-muted mt-0.5">Enter your findings, diagnosis, and patient instructions.</p>
            </div>
            <div className="p-5">
              <textarea
                rows={5}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Enter consultation findings, diagnosis, and instructions..."
                className="block w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </Card>

          {/* Prescription */}
          <Card padding="p-0" className="overflow-hidden">
            <div className="p-4 border-b border-border bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-main">
                <Pill className="w-4 h-4 text-primary" />
                Prescription
              </label>
              <p className="text-xs text-muted mt-0.5">Enter medications, dosage, and instructions for the patient.</p>
            </div>
            <div className="p-5">
              <textarea
                rows={5}
                value={prescription}
                onChange={e => setPrescription(e.target.value)}
                placeholder="E.g. Paracetamol 500mg twice daily for 3 days"
                className="block w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </Card>

          {/* Complete Consultation — compact action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-border rounded-xl px-5 py-4">
            <div>
              <h3 className="font-semibold text-main text-sm">Complete this consultation</h3>
              <p className="text-xs text-muted mt-0.5">
                Saves notes, prescription, and completes the visit.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !notes.trim() || !prescription.trim()}
              className="gap-2 flex-shrink-0"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Consultation
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Consultation;
