import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useApp } from '@/context/AppContext';
import { mockDoctors } from '@/lib/mock-data';

export default function Doctors() {
  const navigate = useNavigate();
  const { triageResult, setSelectedDoctor } = useApp();

  const relevantDoctors = triageResult
    ? mockDoctors.sort((a, b) => {
        if (a.specialty.toLowerCase().includes(triageResult.suggestedSpecialty.toLowerCase().split(' ')[0])) return -1;
        if (b.specialty.toLowerCase().includes(triageResult.suggestedSpecialty.toLowerCase().split(' ')[0])) return 1;
        return 0;
      })
    : mockDoctors;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Choose a Doctor" subtitle={triageResult ? `Recommended: ${triageResult.suggestedSpecialty}` : 'Available doctors'} />

      <div className="flex-1 px-5 pb-6 flex flex-col gap-3">
        {relevantDoctors.map((doc, i) => (
          <motion.button key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={() => { setSelectedDoctor(doc); navigate('/booking'); }}
            className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all text-left group">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">
              {doc.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{doc.name}</h3>
              <p className="text-xs text-muted-foreground">{doc.specialty}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-urgent" /> {doc.rating}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.nextAvailable}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {doc.hospital}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
