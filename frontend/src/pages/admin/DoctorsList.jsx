import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, UserPlus, Clock, Stethoscope, AlertCircle } from 'lucide-react';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAdd, setShowAdd] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    working_start: '09:00',
    working_end: '17:00',
    slot_duration: '30'
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

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

  const loadEligibleUsers = async () => {
    try {
      // Simplification: In a real app we'd fetch users with role=DOCTOR who aren't yet in doctors table
      // Since backend doesn't have an explicit endpoint for this, we'd assume the admin knows the user ID
      // or we just show a generic text input for user_id.
    } catch (e) {}
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/doctors', newDoctor);
      setShowAdd(false);
      setNewDoctor({ name: '', email: '', password: '', specialization: '', working_start: '09:00', working_end: '17:00', slot_duration: '30' });
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add doctor');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Manage Doctors</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Add Doctor Profile'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Create Doctor Profile</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" required value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" placeholder="Dr. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" placeholder="doctor@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" required value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <input type="text" required value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" placeholder="E.g. Cardiologist" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Working Hours Start</label>
              <input type="time" required value={newDoctor.working_start} onChange={e => setNewDoctor({...newDoctor, working_start: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Working Hours End</label>
              <input type="time" required value={newDoctor.working_end} onChange={e => setNewDoctor({...newDoctor, working_end: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slot Duration (Mins)</label>
              <input type="number" required value={newDoctor.slot_duration} onChange={e => setNewDoctor({...newDoctor, slot_duration: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-sm transition-colors">
                Save Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Working Hours</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Slot Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {doctors.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-sky-100 p-2 rounded-full"><Stethoscope className="w-4 h-4 text-primary" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {doc.specialization}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {doc.working_start?.substring(0,5)} - {doc.working_end?.substring(0,5)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {doc.slot_duration} mins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
