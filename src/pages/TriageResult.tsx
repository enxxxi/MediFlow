import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Phone } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { useApp } from '@/context/AppContext';

export default function TriageResult() {
  const navigate = useNavigate();
  const { triageResult } = useApp();

  if (!triageResult) {
    navigate('/triage');
    return null;
  }

  const isEmergency = triageResult.urgency === 'emergency';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Assessment Result" />

      <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
        {/* Urgency Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 shadow-elevated ${isEmergency ? 'bg-emergency/5 border border-emergency/20' : 'bg-card'}`}>
          <div className="flex items-center justify-between mb-3">
            <UrgencyBadge level={triageResult.urgency} size="lg" />
            <span className="text-xs font-medium text-muted-foreground">
              {triageResult.confidenceScore}% confidence
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div className="h-2 rounded-full gradient-primary transition-all" style={{ width: `${triageResult.confidenceScore}%` }} />
          </div>
          <p className="text-sm text-foreground leading-relaxed">{triageResult.riskExplanation}</p>
        </motion.div>

        {/* Symptoms */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-3">Detected Symptoms</h3>
          <div className="flex flex-wrap gap-2">
            {triageResult.symptoms.length > 0 ? triageResult.symptoms.map(s => (
              <span key={s} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium capitalize">{s}</span>
            )) : (
              <span className="text-xs text-muted-foreground">General symptoms detected</span>
            )}
          </div>
        </motion.div>

        {/* Recommendation */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-1">Recommended Specialist</h3>
          <p className="text-sm text-muted-foreground">{triageResult.suggestedSpecialty}</p>
        </motion.div>

        <div className="mt-auto flex flex-col gap-3">
          {isEmergency ? (
            <>
              <button onClick={() => navigate('/emergency')}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-emergency text-emergency-foreground font-semibold shadow-glow-emergency">
                <ShieldAlert className="w-5 h-5" /> Emergency Actions
              </button>
              <a href="tel:911" className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-emergency text-emergency font-semibold">
                <Phone className="w-4 h-4" /> Call Emergency Services
              </a>
            </>
          ) : (
            <button onClick={() => navigate('/doctors')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow-primary">
              Find a Doctor <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
