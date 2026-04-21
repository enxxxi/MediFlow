import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Loader2, Brain } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useApp } from '@/context/AppContext';
import { simulateTriageAnalysis } from '@/lib/mock-data';
import { toast } from 'sonner';

const handleSymptomAnalysis = async (userInput: string) => {
    try {
        const response = await fetch("http://localhost:5000/api/agent/understand-input", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: userInput }),
        });

        if (!response.ok) throw new Error("Failed to connect to backend");

        const structuredData = await response.json();
        return structuredData;
    } catch (error) {
        console.error("Error calling agent:", error);
        return { error: "Could not analyze symptoms" };
    }
};

const followUpQuestions = [
  'How severe is your pain on a scale of 1–10?',
  'How long have you had these symptoms?',
  'Any difficulty breathing?',
];

// Browser Speech Recognition setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function Triage() {
  const navigate = useNavigate();
  const { setTriageResult, symptomInput, setSymptomInput } = useApp();
  const [step, setStep] = useState<'input' | 'analyzing' | 'followup' | 'done'>('input');
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    let finalTranscript = symptomInput;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interim = transcript;
        }
      }
      setSymptomInput(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permission and try again.');
      } else {
        toast.error(`Voice input error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
      if (!symptomInput.trim()) return;
      
      recognitionRef.current?.stop();
      setIsListening(false);
      setStep('analyzing');

      // --- CALL REAL BACKEND AGENT ---
      const result = await handleSymptomAnalysis(symptomInput);

      if (result.error) {
        toast.error("Backend error: Make sure Node.js is running.");
        setStep('input');
        return;
      }

      // Logic: If AI is unsure (confidence below 85), go to follow-up
      if (result.confidenceScore < 85) {
        setStep('followup');
      } else {
        setTriageResult(result);
        setStep('done');
        setTimeout(() => navigate('/triage-result'), 500);
      }
    };

  const handleFollowUp = async () => {
      const newAnswers = [...followUpAnswers, currentAnswer];
      setFollowUpAnswers(newAnswers);
      setCurrentAnswer('');

      if (followUpIndex < followUpQuestions.length - 1) {
        setFollowUpIndex(i => i + 1);
      } else {
        setStep('analyzing');
        
        // Combine the original input with the new detailed answers
        const combinedInput = `${symptomInput}. Additional details: ${newAnswers.join(' ')}`;
        
        // --- CALL REAL BACKEND AGENT AGAIN ---
        const finalResult = await handleSymptomAnalysis(combinedInput);

        if (finalResult.error) {
          toast.error("Analysis failed. Please try again.");
          setStep('input');
        } else {
          setTriageResult(finalResult);
          setStep('done');
          setTimeout(() => navigate('/triage-result'), 500);
        }
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

                <div className="relative">
                  <textarea
                    value={symptomInput}
                    onChange={e => setSymptomInput(e.target.value)}
                    placeholder="Describe your symptoms in detail..."
                    rows={5}
                    className="w-full rounded-2xl border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none shadow-card"
                  />
                  {isListening && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emergency/10 border border-emergency/20">
                      <span className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
                      <span className="text-xs font-medium text-emergency">Listening...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={toggleVoiceInput}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  title={isListening ? 'Stop voice input' : 'Start voice input'}
                  className={`p-3 rounded-xl transition-all ${
                    isListening
                      ? 'bg-emergency/10 text-emergency border border-emergency/20 shadow-glow-emergency'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}>
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
                <button
                  onClick={handleFollowUp}
                  disabled={!currentAnswer.trim()}
                  aria-label="Submit follow-up answer"
                  title="Submit follow-up answer"
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