import { Routes, Route } from 'react-router-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import DoctorHome from './DoctorHome';
import Consultation from './Consultation';
import DashboardLayout from '../../components/layout/DashboardLayout';

const DoctorDashboard = () => {
  const navItems = [
    { name: 'Dashboard', path: '/doctor', icon: <CalendarIcon className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout sidebarTitle="Doctor Menu" navItems={navItems} basePath="/doctor">
      <Routes>
        <Route path="/" element={<DoctorHome />} />
        <Route path="/consultation/:id" element={<Consultation />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
