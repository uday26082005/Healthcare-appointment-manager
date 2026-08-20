import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Calendar, Loader2, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  
  const [loading, setLoading] = useState({ doctors: false, slots: false, booking: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(p => ({...p, doctors: true}));
      try {
        const res = await api.get(`/patient/doctors?specialization=${specialization}`);
        setDoctors(res.data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load doctors.');
      } finally {
        setLoading(p => ({...p, doctors: false}));
      }
    };
    fetchDoctors();
  }, [specialization]);

  // Fetch Slots
  useEffect(() => {
    if (!selectedDoctor || !date) return;
    const fetchSlots = async () => {
      setLoading(p => ({...p, slots: true}));
      setSelectedSlot(null);
      try {
        const res = await api.get(`/patient/doctors/${selectedDoctor.id}/slots?date=${date}`);
        setSlots(res.data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load slots.');
        setSlots([]);
      } finally {
        setLoading(p => ({...p, slots: false}));
      }
    };
    fetchSlots();
  }, [selectedDoctor, date]);

  const handleBook = async () => {
    if (!selectedSlot) return setError('Please select a time slot');
    if (!symptoms.trim()) return setError('Please enter your symptoms');
    
    setError('');
    setLoading(p => ({...p, booking: true}));
    try {
      await api.post('/patient/appointments/book', {
        doctor_id: selectedDoctor.id,
        date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        symptoms
      });
      setSuccess(true);
      setTimeout(() => navigate('/patient/appointments'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(p => ({...p, booking: false}));
    }
  };

  if (success) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg mx-auto mt-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Booked!</h2>
        <p className="text-slate-600 mb-6">Your appointment has been successfully confirmed. We are redirecting you to your appointments...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Book New Appointment</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 mb-6 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1 & 2: Doctor & Date */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">1. Select Specialization</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="E.g. Cardiologist (Leave blank for all)"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">2. Choose Doctor</label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {loading.doctors ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : doctors.length > 0 ? (
                doctors.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDoctor(doc); setDate(''); setSlots([]); }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      selectedDoctor?.id === doc.id ? 'border-primary bg-sky-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="bg-slate-100 p-2 rounded-full"><User className="w-5 h-5 text-slate-600" /></div>
                    <div>
                      <p className="font-semibold text-slate-900">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.specialization} • Exp: {doc.experience_years}y</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic p-2">No doctors found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 & 4: Slot & Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">3. Select Date</label>
            <input
              type="date"
              disabled={!selectedDoctor}
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">4. Available Slots</label>
            {loading.slots ? (
              <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : !date ? (
              <p className="text-sm text-slate-500 italic p-2">Select a date first.</p>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-2 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      selectedSlot === slot 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {slot.start.substring(0,5)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-100">No available slots for this date.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">5. Symptoms / Reason for Visit</label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please briefly describe your symptoms..."
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <button
            onClick={handleBook}
            disabled={loading.booking || !selectedSlot || !symptoms.trim()}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading.booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
