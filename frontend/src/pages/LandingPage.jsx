import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  Mail,
  ArrowRight,
} from 'lucide-react';

const LandingPage = () => {

  const features = [
    {
      icon: <CalendarCheck className="w-5 h-5 text-primary" />,
      title: 'Smart Booking',
      description:
        'Book appointments instantly with real-time slot availability and specialization-based doctor selection.',
    },
    {
      icon: <Stethoscope className="w-5 h-5 text-primary" />,
      title: 'AI-Powered Consultations',
      description:
        'AI pre-visit analysis helps doctors understand symptoms in advance, making consultations more efficient.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      title: 'Secure Clinical Records',
      description:
        'Your clinical notes, prescriptions, and visit summaries are securely stored and accessible anytime.',
    },
    {
      icon: <Clock className="w-5 h-5 text-primary" />,
      title: 'Automated Reminders',
      description:
        'Receive email reminders for upcoming appointments so you never miss a visit.',
    },
    {
      icon: <Mail className="w-5 h-5 text-primary" />,
      title: 'Email Notifications',
      description:
        'Automatic confirmation and update emails keep both patients and doctors informed at every step.',
    },
    {
      icon: <CalendarCheck className="w-5 h-5 text-primary" />,
      title: 'Google Calendar Sync',
      description:
        'Patients can connect Google Calendar to automatically add and manage their appointments.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create your account',
      description: 'Sign up as a patient in seconds.',
    },
    {
      number: '02',
      title: 'Book an appointment',
      description: 'Choose a specialization, pick a doctor, select a date and time slot.',
    },
    {
      number: '03',
      title: 'Meet your doctor',
      description: 'Attend your consultation. AI analysis is prepared in advance.',
    },
    {
      number: '04',
      title: 'Receive your summary',
      description: 'Get a clear AI-generated post-visit summary with your prescription.',
    },
  ];

  return (
    <div className="flex-grow flex flex-col bg-white">

      {/* ── HERO ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 flex flex-col items-center text-center">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-8">
          <HeartPulse className="w-7 h-7 text-primary" />
          <span className="text-lg font-bold text-main tracking-tight">HealthSync</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-main tracking-tight max-w-3xl leading-tight mb-6">
          Smart healthcare appointments,{' '}
          <span className="text-primary">simplified.</span>
        </h1>

        <p className="text-lg text-muted max-w-xl leading-relaxed mb-10">
          HealthSync connects patients and doctors through intelligent scheduling,
          AI-assisted consultations, and secure clinical records — all in one platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold text-base transition-colors shadow-sm"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-main px-8 py-3 rounded-lg font-semibold text-base transition-colors border border-border"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="w-full bg-slate-50 border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-main mb-3">How it works</h2>
            <p className="text-muted max-w-lg mx-auto">
              From booking to follow-up — everything in four simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <span className="text-3xl font-extrabold text-primary/20 block mb-3 leading-none">
                  {step.number}
                </span>
                <h3 className="text-base font-bold text-main mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="w-full py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-main mb-3">Platform capabilities</h2>
            <p className="text-muted max-w-lg mx-auto">
              Everything you need for a complete appointment and consultation experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-main mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="w-full bg-primary py-16 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-white/80 mb-8 text-base">
            Join HealthSync and experience a better way to manage your healthcare.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-slate-50 px-8 py-3 rounded-lg font-semibold text-base transition-colors shadow-sm"
            >
              Create an Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-primary-dark hover:bg-primary-dark/90 text-white px-8 py-3 rounded-lg font-semibold text-base transition-colors border border-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
