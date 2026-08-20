import { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserPlus, Clock, Stethoscope } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const inputClass =
  'block w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full pb-8 space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Doctors</h1>
          <p className="text-sm text-muted mt-1">Manage registered doctors and their availability.</p>
        </div>
        <Button
          variant={showAdd ? 'outline' : 'primary'}
          onClick={() => setShowAdd(!showAdd)}
          className="gap-2 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Add Doctor'}
        </Button>
      </div>

      {/* Add Doctor Form */}
      {showAdd && (
        <Card padding="p-0" className="overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50">
            <h2 className="text-sm font-bold text-main">Create Doctor Profile</h2>
            <p className="text-xs text-muted mt-0.5">Fill in the details to register a new doctor.</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Name</label>
                <input
                  type="text" required
                  value={newDoctor.name}
                  onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
                  className={inputClass}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Email</label>
                <input
                  type="email" required
                  value={newDoctor.email}
                  onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                  className={inputClass}
                  placeholder="doctor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Password</label>
                <input
                  type="password" required
                  value={newDoctor.password}
                  onChange={e => setNewDoctor({...newDoctor, password: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Specialization</label>
                <input
                  type="text" required
                  value={newDoctor.specialization}
                  onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})}
                  className={inputClass}
                  placeholder="E.g. Cardiologist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Working Hours Start</label>
                <input
                  type="time" required
                  value={newDoctor.working_start}
                  onChange={e => setNewDoctor({...newDoctor, working_start: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Working Hours End</label>
                <input
                  type="time" required
                  value={newDoctor.working_end}
                  onChange={e => setNewDoctor({...newDoctor, working_end: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-main mb-1.5">Slot Duration (mins)</label>
                <input
                  type="number" required
                  value={newDoctor.slot_duration}
                  onChange={e => setNewDoctor({...newDoctor, slot_duration: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2 flex justify-end pt-2">
                <Button type="submit" variant="primary">
                  Save Doctor
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && <Alert type="error" message={error} />}

      {/* Doctors Table */}
      {!error && (
        doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors found"
            description="No doctor profiles have been added yet. Use the button above to add one."
          />
        ) : (
          <Card padding="p-0" className="overflow-hidden">
            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Specialization</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Working Hours</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Slot</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-primary flex-shrink-0">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-main">{doc.name}</p>
                            <p className="text-xs text-muted">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-main">
                        {doc.specialization}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{doc.working_start?.substring(0,5)} – {doc.working_end?.substring(0,5)}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-muted">
                        {doc.slot_duration} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </div>
  );
};

export default DoctorsList;
