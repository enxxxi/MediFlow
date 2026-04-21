import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { useApp } from '@/context/AppContext';

export default function Appointments() {
  const navigate = useNavigate();
  const { appointments } = useApp();
  const upcoming = appointments.filter(a => a.status === 'upcoming');
  const past = appointments.filter(a => a.status !== 'upcoming');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="My Appointments" subtitle={`${upcoming.length} upcoming`} />

      <div className="flex-1 px-5 pb-6">
        {upcoming.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
            <div className="flex flex-col gap-3">
              {upcoming.map((apt, i) => (
                <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-xl">{apt.doctor.avatar}</div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{apt.doctor.name}</h3>
                        <p className="text-xs text-muted-foreground">{apt.doctor.specialty}</p>
                      </div>
                    </div>
                    <UrgencyBadge level={apt.urgency} size="sm" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {apt.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Past</h2>
            <div className="flex flex-col gap-3">
              {past.map(apt => (
                <div key={apt.id} className="bg-card/60 rounded-2xl p-4 shadow-card opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">{apt.doctor.avatar}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{apt.doctor.name}</h3>
                      <p className="text-xs text-muted-foreground">{apt.date} · {apt.time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {appointments.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-bold text-foreground">No Appointments</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started by describing your symptoms</p>
            <button onClick={() => navigate('/triage')}
              className="mt-4 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
              Get Medical Help
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
