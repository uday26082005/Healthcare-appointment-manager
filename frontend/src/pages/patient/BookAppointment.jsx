import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [specialization, setSpecialization] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  
  const [loading, setLoading] = useState({ doctors: false, slots: false, booking: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(p => ({...p, doctors: true}));
      setSelectedDoctor(null);
      setDate('');
      setSlots([]);
      setSelectedSlot(null);
      
      try {
        const res = await api.get(`/patient/doctors${specialization ? `?specialization=${specialization}` : ''}`);
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
      <EmptyState
        icon={CheckCircle}
        title="Appointment Booked!"
        description="Your appointment has been successfully confirmed. We are redirecting you to your appointments..."
        className="mt-8 max-w-lg mx-auto"
      />
    );
  }

  const doctorOptions = doctors.map(doc => ({
    label: `${doc.name} - ${doc.specialization}`,
    value: doc.id
  }));

  const morningSlots = slots.filter(s => parseInt(s.start.split(':')[0], 10) < 12);
  const afternoonSlots = slots.filter(s => parseInt(s.start.split(':')[0], 10) >= 12);

  const isFormComplete = selectedDoctor && date && selectedSlot && symptoms.trim();

  return (
    <div className="w-full pb-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-main">Book an Appointment</h1>
        <p className="text-muted mt-1 text-sm">Find a doctor and choose a convenient time for your visit.</p>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: Booking Flow */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          
          {/* Step 1: Choose Doctor */}
          <Card padding="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">01</div>
              <h2 className="text-lg font-bold text-main mt-1">Choose your doctor</h2>
            </div>
            
            <div className="space-y-5 ml-0 sm:ml-12">
              <Input
                label="Specialization"
                placeholder="E.g. Cardiologist (Leave blank for all)"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
              />

              <div className="relative">
                {loading.doctors && (
                  <div className="absolute right-3 top-9">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                <Select
                  label="Doctor"
                  placeholder="Select doctor"
                  options={doctorOptions}
                  value={selectedDoctor?.id || ''}
                  onChange={e => {
                    const docId = parseInt(e.target.value);
                    const doc = doctors.find(d => d.id === docId);
                    setSelectedDoctor(doc);
                    setDate('');
                    setSlots([]);
                  }}
                  disabled={loading.doctors}
                />
              </div>
            </div>
          </Card>

          {/* Step 2: Date & Time */}
          <Card padding="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">02</div>
              <h2 className="text-lg font-bold text-main mt-1">Choose date & time</h2>
            </div>

            <div className="space-y-6 ml-0 sm:ml-12">
              <Input
                type="date"
                label="Choose date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!selectedDoctor}
              />

              <div>
                <label className="block text-sm font-medium text-main mb-3">Available time</label>
                {loading.slots ? (
                  <LoadingSpinner size="md" />
                ) : !date ? (
                  <p className="text-sm text-muted bg-slate-50 p-4 rounded-xl border border-dashed border-border text-center">Please select a date first to see available slots.</p>
                ) : slots.length > 0 ? (
                  <div className="space-y-6">
                    
                    {morningSlots.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Morning</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {morningSlots.map((slot, i) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-1 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${
                                  isSelected
                                    ? 'bg-primary border-primary text-white shadow-sm'
                                    : 'bg-surface border-border text-main hover:border-primary hover:text-primary'
                                }`}
                              >
                                {slot.start.substring(0,5)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Afternoon</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {afternoonSlots.map((slot, i) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-1 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${
                                  isSelected
                                    ? 'bg-primary border-primary text-white shadow-sm'
                                    : 'bg-surface border-border text-main hover:border-primary hover:text-primary'
                                }`}
                              >
                                {slot.start.substring(0,5)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert type="error" message="No available slots for this date." className="py-3" />
                )}
              </div>
            </div>
          </Card>

          {/* Step 3: Details */}
          <Card padding="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">03</div>
              <h2 className="text-lg font-bold text-main mt-1">Reason for visit</h2>
            </div>
            <div className="ml-0 sm:ml-12">
              <textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Please briefly describe your symptoms..."
                className="block w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-surface transition-colors"
              />
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: Summary */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-28">
          <Card padding="p-0" className="overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-slate-50">
              <h2 className="text-lg font-bold text-main">Appointment Summary</h2>
            </div>
            
            <div className="p-6 flex-1 bg-surface">
              {selectedDoctor && date && selectedSlot ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Doctor</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-main leading-tight">{selectedDoctor.name}</p>
                        <p className="text-xs font-medium text-muted">{selectedDoctor.specialization}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Date & Time</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-main">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-main">
                          {selectedSlot.start.substring(0,5)} – {selectedSlot.end.substring(0,5)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-main text-sm">Your appointment will appear here</h3>
                  <p className="text-xs text-muted max-w-[200px] leading-relaxed">
                    Select a doctor, date, and time to review your booking.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 mt-auto bg-surface">
              <Button
                variant="primary"
                className="w-full gap-2 shadow-sm"
                disabled={loading.booking || !isFormComplete}
                onClick={handleBook}
              >
                {loading.booking ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white mr-2" /> Processing...
                  </>
                ) : (
                  'Confirm Appointment'
                )}
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default BookAppointment;
