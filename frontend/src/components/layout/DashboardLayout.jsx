import Navbar from '../Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ sidebarTitle, navItems, basePath, children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 md:gap-8">
        <Sidebar title={sidebarTitle} navItems={navItems} basePath={basePath} />
        <main className="flex-grow min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
