import { Routes, Route } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CalendarPlus } from 'lucide-react';
import PatientHome from './PatientHome';
import BookAppointment from './BookAppointment';
import MyAppointments from './MyAppointments';
import DashboardLayout from '../../components/layout/DashboardLayout';

const PatientDashboard = () => {
  const navItems = [
    { name: 'Dashboard', path: '/patient', icon: <CalendarIcon className="w-5 h-5" /> },
    { name: 'Book Appointment', path: '/patient/book', icon: <CalendarPlus className="w-5 h-5" /> },
    { name: 'My Appointments', path: '/patient/appointments', icon: <Clock className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout sidebarTitle="Patient Menu" navItems={navItems} basePath="/patient">
      <Routes>
        <Route path="/" element={<PatientHome />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/appointments" element={<MyAppointments />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PatientDashboard;
