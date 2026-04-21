import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Check, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { useApp } from '@/context/AppContext';
import { Appointment } from '@/lib/types';

export default function Booking() {
  const navigate = useNavigate();
  const { selectedDoctor, triageResult, addAppointment } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!selectedDoctor) { navigate('/doctors'); return null; }

  const handleConfirm = () => {
    if (!selectedSlot) return;
    const apt: Appointment = {
      id: Date.now().toString(),
      doctor: selectedDoctor,
      date: selectedDoctor.nextAvailable.includes('Today') ? 'Today' : 'Tomorrow',
      time: selectedSlot,
      urgency: triageResult?.urgency || 'non-urgent',
      symptoms: triageResult?.symptoms || [],
      status: 'upcoming',
    };
    addAppointment(apt);
    setConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Book Appointment" />

      <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 flex-1">
              {/* Doctor Info */}
              <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl">{selectedDoctor.avatar}</div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{selectedDoctor.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
                  <p className="text-xs text-muted-foreground">{selectedDoctor.hospital}</p>
                </div>
              </div>

              {triageResult && (
                <div className="flex items-center gap-2">
                  <UrgencyBadge level={triageResult.urgency} size="sm" />
                  <span className="text-xs text-muted-foreground">Based on your assessment</span>
                </div>
              )}

              {/* Time Slots */}
              <div className="bg-card rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Available Slots</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDoctor.slots.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedSlot === slot
                          ? 'gradient-primary text-primary-foreground shadow-glow-primary'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}>
                      <Clock className="w-3 h-3 inline mr-1" />{slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <button onClick={handleConfirm} disabled={!selectedSlot}
                  className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow-primary disabled:opacity-40 transition-all">
                  Confirm Appointment
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="w-20 h-20 rounded-full bg-safe flex items-center justify-center">
                <Check className="w-10 h-10 text-safe-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Appointment Confirmed!</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedDoctor.name} · {selectedSlot}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selectedDoctor.hospital}</p>
              </div>
              <button onClick={() => navigate('/appointments')}
                className="px-8 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow-primary mt-4">
                View Appointments
              </button>
              <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
