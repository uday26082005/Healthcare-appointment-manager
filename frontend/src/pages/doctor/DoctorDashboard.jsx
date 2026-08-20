import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Users, Activity, FileText } from 'lucide-react';
import DoctorHome from './DoctorHome';
import Consultation from './Consultation';

const DoctorDashboard = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/doctor', icon: <CalendarIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-24">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Doctor Menu</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-sky-50 text-primary' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow min-w-0">
        <Routes>
          <Route path="/" element={<DoctorHome />} />
          <Route path="/consultation/:id" element={<Consultation />} />
        </Routes>
      </main>
    </div>
  );
};

export default DoctorDashboard;
