import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, CalendarOff, AlertCircle, CheckCircle } from 'lucide-react';

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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900">Manage Doctor Leave</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-3 border border-green-100">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="bg-rose-100 p-2 rounded-full text-rose-600"><CalendarOff className="w-5 h-5" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Record Leave Day</h3>
            <p className="text-sm text-slate-500">Marking a doctor as on leave will automatically cancel their appointments for that day.</p>
          </div>
        </div>

        <form onSubmit={handleAddLeave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm outline-none bg-slate-50 focus:bg-white"
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Leave Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Leave Day'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveManagement;
