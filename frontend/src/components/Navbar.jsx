import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, LogOut, User } from 'lucide-react';
import Badge from './ui/Badge';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'DOCTOR') return '/doctor';
    return '/patient';
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={getDashboardLink()} className="flex items-center gap-2">
              <HeartPulse className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-main tracking-tight">HealthSync</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted font-medium">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline text-main font-semibold">{user.name}</span>
                  <Badge variant="neutral" size="sm">
                    {user.role}
                  </Badge>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-muted hover:text-error hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-muted hover:text-primary font-medium text-sm transition-colors px-2 py-1">
                  Sign in
                </Link>
                <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
