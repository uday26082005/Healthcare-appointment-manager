import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ConnectCalendarCallback from './pages/ConnectCalendarCallback';
import PublicLayout from './components/layout/PublicLayout';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/calendar/callback" element={<PublicLayout><ConnectCalendarCallback /></PublicLayout>} />
        
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>
        } />
        
        <Route path="/patient/*" element={
          <ProtectedRoute allowedRole="PATIENT"><PatientDashboard /></ProtectedRoute>
        } />
        
        <Route path="/doctor/*" element={
          <ProtectedRoute allowedRole="DOCTOR"><DoctorDashboard /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
