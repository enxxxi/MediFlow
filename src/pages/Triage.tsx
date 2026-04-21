import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Loader2, Brain } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useApp } from '@/context/AppContext';
import { simulateTriageAnalysis } from '@/lib/mock-data';

const followUpQuestions = [
  'How severe is your pain on a scale of 1–10?',
  'How long have you had these symptoms?',
  'Any difficulty breathing?',
];

export default function Triage() {
  const navigate = useNavigate();
  const { setTriageResult, symptomInput, setSymptomInput } = useApp();
  const [step, setStep] = useState<'input' | 'analyzing' | 'followup' | 'done'>('input');
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const handleSubmit = () => {
    if (!symptomInput.trim()) return;
    setStep('analyzing');
    setTimeout(() => {
      const result = simulateTriageAnalysis(symptomInput);
      if (result.confidenceScore < 85) {
        setStep('followup');
      } else {
        setTriageResult(result);
        setStep('done');
        setTimeout(() => navigate('/triage-result'), 500);
      }
    }, 2000);
  };

  const handleFollowUp = () => {
    const newAnswers = [...followUpAnswers, currentAnswer];
    setFollowUpAnswers(newAnswers);
    setCurrentAnswer('');
    if (followUpIndex < followUpQuestions.length - 1) {
      setFollowUpIndex(i => i + 1);
    } else {
      setStep('analyzing');
      setTimeout(() => {
        const result = simulateTriageAnalysis(symptomInput + ' ' + newAnswers.join(' '));
        setTriageResult(result);
        setStep('done');
        setTimeout(() => navigate('/triage-result'), 500);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Symptom Check" subtitle="Describe what you're feeling" />

      <div className="flex-1 px-5 pb-6 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-card rounded-2xl shadow-card p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Examples you can try:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Fever and cough for 3 days', 'Sharp chest pain', 'Persistent headache'].map(ex => (
                      <button key={ex} onClick={() => setSymptomInput(ex)}
                        className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  placeholder="Describe your symptoms in detail..."
                  rows={5}
                  className="w-full rounded-2xl border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none shadow-card"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-accent transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button onClick={handleSubmit} disabled={!symptomInput.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow-primary disabled:opacity-40 transition-all">
                  <Send className="w-4 h-4" /> Analyze Symptoms
                </button>
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
                  <Brain className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-ring" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">Analyzing Symptoms</h2>
                <p className="text-sm text-muted-foreground mt-1">AI is processing your information...</p>
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </motion.div>
          )}

          {step === 'followup' && (
            <motion.div key="followup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col">
              <div className="bg-accent/50 rounded-2xl p-4 mb-4">
                <p className="text-xs font-medium text-accent-foreground mb-1">Additional information needed</p>
                <p className="text-sm text-foreground">{followUpQuestions[followUpIndex]}</p>
              </div>
              <div className="flex-1" />
              <div className="flex gap-3">
                <input
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFollowUp()}
                  placeholder="Your answer..."
                  className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={handleFollowUp} disabled={!currentAnswer.trim()}
                  className="px-4 rounded-xl gradient-primary text-primary-foreground font-semibold disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
