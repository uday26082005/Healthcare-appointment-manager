import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <nav style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: 0, paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
            Healthcare Appointment Manager
          </h1>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/patient/*" element={<PatientDashboard />} />
          <Route path="/doctor/*" element={<DoctorDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
