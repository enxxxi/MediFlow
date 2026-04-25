import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Stethoscope, X, Info } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { useApp } from '@/context/AppContext';

export default function Appointments() {
  const navigate = useNavigate();
  const { appointments } = useApp();
  
  // State for the "Detail Popup"
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const upcoming = appointments.filter(a => a.status === 'upcoming');
  const past = appointments.filter(a => a.status !== 'upcoming');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white">
      <PageHeader title="My Appointments" subtitle={`${upcoming.length} upcoming`} />

      <div className="flex-1 px-5 pb-6">
        {/* Upcoming Section */}
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Upcoming</h2>
        <div className="flex flex-col gap-3 mb-8">
          {upcoming.map((apt) => (
            <motion.div 
              key={apt.id} 
              onClick={() => setSelectedApt(apt)} // Open Modal on click
              className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-xl">{apt.doctor.avatar}</div>
                  <div>
                    <h3 className="font-bold text-sm">{apt.doctor.name}</h3>
                    <p className="text-xs text-white/50">{apt.doctor.specialty}</p>
                  </div>
                </div>
                <UrgencyBadge level={apt.urgency} size="sm" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Past Section */}
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Past Records</h2>
        <div className="flex flex-col gap-3">
          {past.map(apt => (
            <div 
              key={apt.id} 
              onClick={() => setSelectedApt(apt)}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg opacity-50">{apt.doctor.avatar}</span>
                <div className="flex-1 text-sm font-medium">{apt.doctor.name}</div>
                <div className="text-xs text-white/40">{apt.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedApt && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-3xl">
                     {selectedApt.doctor.avatar}
                   </div>
                   <div>
                     <h2 className="text-xl font-bold">{selectedApt.doctor.name}</h2>
                     <p className="text-cyan-400 font-medium">{selectedApt.doctor.specialty}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedApt(null)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="text-white/40 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-semibold">{selectedApt.doctor.hospital}</p>
                    <p className="text-xs text-white/50">{selectedApt.doctor.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Info className="text-white/40 shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-white/40 uppercase font-bold tracking-tight">Purpose</p>
                    <p className="text-sm">{selectedApt.purpose}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                   <div className="bg-white/5 rounded-2xl p-4">
                     <p className="text-xs text-white/40 mb-1">Date</p>
                     <p className="text-sm font-bold">{selectedApt.date}</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4">
                     <p className="text-xs text-white/40 mb-1">Time</p>
                     <p className="text-sm font-bold">{selectedApt.time}</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedApt(null)}
                className="w-full mt-8 py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl hover:bg-cyan-400 transition-all"
              >
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}