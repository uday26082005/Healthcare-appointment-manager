import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Sidebar = ({ title, navItems, basePath }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderNavLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (basePath && item.path !== basePath && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive
                ? 'bg-sky-50 text-primary'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button (Visible only on mobile) */}
      <div className="md:hidden w-full mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-border text-sm font-medium text-main shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Menu className="w-4 h-4 text-muted" />
            <span>{title || 'Menu'}</span>
          </span>
          <span className="text-xs text-primary font-semibold">
            {mobileOpen ? 'Hide' : 'Open Navigation'}
          </span>
        </button>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="mt-2 bg-white rounded-2xl shadow-sm border border-border p-3 animate-in fade-in">
            {renderNavLinks()}
          </div>
        )}
      </div>

      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 sticky top-24">
          {title && (
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">
              {title}
            </h2>
          )}
          {renderNavLinks()}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
