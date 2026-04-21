import { motion } from 'framer-motion';
import { Phone, MapPin, Heart, ShieldAlert, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

const hospitals = [
  { name: 'City General Hospital', distance: '0.8 km', eta: '3 min' },
  { name: 'MediFlow Emergency Center', distance: '1.2 km', eta: '5 min' },
  { name: 'St. Mary\'s Medical', distance: '2.4 km', eta: '8 min' },
];

const firstAid = [
  'Stay calm and assess the situation',
  'Call emergency services immediately',
  'Do not move the patient if spinal injury is suspected',
  'Apply pressure to any bleeding wounds',
  'Keep the patient warm and comfortable',
];

export default function Emergency() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Emergency Mode" subtitle="Immediate assistance" />

      <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
        {/* Emergency Call */}
        <motion.a href="tel:911" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-3 py-5 rounded-2xl gradient-emergency text-emergency-foreground shadow-glow-emergency">
          <Phone className="w-6 h-6" />
          <span className="text-lg font-bold">Call Emergency — 911</span>
        </motion.a>

        {/* Alert Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-emergency/5 border border-emergency/15">
          <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            If you are experiencing a medical emergency, call emergency services immediately. Do not rely solely on this app.
          </p>
        </motion.div>

        {/* Nearby Hospitals */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Nearest Hospitals
          </h3>
          <div className="flex flex-col gap-3">
            {hospitals.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.distance} away</p>
                </div>
                <span className="text-xs font-bold text-primary bg-accent px-2.5 py-1 rounded-lg">{h.eta}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* First Aid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-emergency" /> First Aid Instructions
          </h3>
          <ol className="flex flex-col gap-2">
            {firstAid.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
