import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarOff, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const inputClass =
  'block w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const LeaveManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [leaveDate, setLeaveDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/admin/doctors');
        setDoctors(res.data);
      } catch (err) {
        setError('Failed to load doctors.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !leaveDate) {
      return setError('Please select a doctor and date.');
    }

    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await api.post(`/admin/doctors/${selectedDoctor}/leaves`, {
        leave_date: leaveDate,
        reason: null
      });
      setMessage(res.data.message || 'Leave day added successfully.');
      setLeaveDate('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add leave day.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full pb-8 space-y-6 max-w-2xl">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-main">Leave Management</h1>
        <p className="text-sm text-muted mt-1">Schedule and manage doctor leave days.</p>
      </div>

      {/* Feedback messages */}
      {error && <Alert type="error" message={error} />}
      {message && <Alert type="success" message={message} />}

      {/* Leave Form Card */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <CalendarOff className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-main">Record Leave Day</h2>
            <p className="text-xs text-muted mt-0.5">
              Marking a doctor as on leave will automatically cancel their appointments for that day.
            </p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleAddLeave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-main mb-1.5">Select Doctor</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-main mb-1.5">Leave Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Leave Day'
                )}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default LeaveManagement;
