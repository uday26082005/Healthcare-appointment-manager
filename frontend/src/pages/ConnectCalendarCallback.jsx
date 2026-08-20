import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const ConnectCalendarCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const hasFetched = useRef(false);

  useEffect(() => {
    const linkCalendar = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setStatus('error');
        return;
      }

      try {
        await api.get(`/calendar/callback?code=${code}&state=${state}`);
        setStatus('success');
        
        // Auto redirect back to dashboard after 3 seconds
        setTimeout(() => {
          if (!user) navigate('/login');
          else if (user.role === 'ADMIN') navigate('/admin');
          else if (user.role === 'DOCTOR') navigate('/doctor');
          else navigate('/patient');
        }, 3000);
      } catch (err) {
        setStatus('error');
      }
    };

    linkCalendar();
  }, [searchParams, navigate, user]);

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-slate-800">Linking Calendar...</h2>
            <p className="text-slate-500 mt-2">Please wait while we securely connect your account.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800">Calendar Linked!</h2>
            <p className="text-slate-500 mt-2">Your Google Calendar has been successfully connected.</p>
            <p className="text-sm text-slate-400 mt-4">Redirecting you back...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800">Connection Failed</h2>
            <p className="text-slate-500 mt-2">We couldn't link your Google Calendar. Please try again later.</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectCalendarCallback;
