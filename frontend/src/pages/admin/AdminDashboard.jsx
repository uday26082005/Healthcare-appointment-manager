import { Routes, Route } from 'react-router-dom';
import { Users, CalendarOff } from 'lucide-react';
import DoctorsList from './DoctorsList';
import LeaveManagement from './LeaveManagement';
import DashboardLayout from '../../components/layout/DashboardLayout';

const AdminDashboard = () => {
  const navItems = [
    { name: 'Doctors', path: '/admin', icon: <Users className="w-5 h-5" /> },
    { name: 'Leave Management', path: '/admin/leave', icon: <CalendarOff className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout sidebarTitle="Admin Menu" navItems={navItems} basePath="/admin">
      <Routes>
        <Route path="/" element={<DoctorsList />} />
        <Route path="/leave" element={<LeaveManagement />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
