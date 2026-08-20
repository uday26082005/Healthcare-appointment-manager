import Navbar from '../Navbar';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
