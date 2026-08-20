import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Clock, ShieldCheck, Stethoscope } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  }

  const features = [
    {
      icon: <CalendarCheck className="w-6 h-6 text-primary" />,
      title: 'Smart Booking',
      description: 'Book appointments instantly with real-time availability and smart scheduling.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: 'Secure Records',
      description: 'Your clinical notes, prescriptions, and summaries are securely stored and easily accessible.'
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: 'Smart Reminders',
      description: 'Never miss an appointment or medication dose with our automated reminder system.'
    },
    {
      icon: <Stethoscope className="w-6 h-6 text-primary" />,
      title: 'AI-Powered Insights',
      description: 'Advanced AI helps structure symptoms for doctors and simplifies summaries for patients.'
    }
  ];

  return (
    <div className="flex-grow flex flex-col items-center bg-white">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mb-6">
          Modern Healthcare Management, <span className="text-primary">Simplified.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
          HealthSync connects patients and doctors with an intelligent, seamless scheduling and clinical follow-up experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg">
            Create an Account
          </Link>
          <Link to="/login" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors border border-slate-200">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-slate-50 py-20 border-t border-slate-100 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-sky-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
