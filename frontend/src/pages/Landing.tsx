import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, CalendarDays, AlertTriangle, LogOut } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Landing() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated"); // Remove the login flag
    navigate("/login"); // Send user back to login page
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="gradient-hero px-6 pt-14 pb-16 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 right-8 w-32 h-32 rounded-full border-2 border-primary-foreground/30 animate-pulse-ring" />
          <div className="absolute bottom-12 left-6 w-20 h-20 rounded-full border border-primary-foreground/20 animate-float" />
        </div>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="MediFlow" className="w-12 h-12 rounded-lg" />
              <span className="text-3xl font-bold text-white tracking-tight">MediFlow</span>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Smart Health<br />Triage & Booking
          </h1>
          <p className="text-white/80 mt-3 text-sm leading-relaxed max-w-xs">
            AI-powered symptom analysis, instant urgency assessment, and seamless doctor appointments.
          </p>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div variants={container} initial="hidden" animate="show" className="px-5 -mt-8 relative z-20 flex-1 flex flex-col gap-3 pb-8">
        <motion.button variants={item} onClick={() => navigate('/triage')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-card shadow-elevated hover:shadow-glow-primary transition-all group">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Get Medical Help</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Describe symptoms, get AI triage</p>
          </div>
        </motion.button>

        <motion.button variants={item} onClick={() => navigate('/appointments')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all group">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground group-hover:text-secondary transition-colors">My Appointments</h3>
            <p className="text-xs text-muted-foreground mt-0.5">View appointments</p>
          </div>
        </motion.button>

        <motion.button variants={item} onClick={() => navigate('/emergency')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-emergency/5 border border-emergency/15 shadow-card hover:shadow-glow-emergency transition-all group">
          <div className="w-12 h-12 rounded-xl gradient-emergency flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-emergency-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-emergency group-hover:text-emergency transition-colors">Emergency Mode</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Immediate help & nearby hospitals</p>
          </div>
        </motion.button>

        <div className="mt-auto pt-6 text-center">
          <p className="text-xs text-muted-foreground">Powered by AI · Not a substitute for emergency services</p>
        </div>
      </motion.div>
    </div>
  );
}
