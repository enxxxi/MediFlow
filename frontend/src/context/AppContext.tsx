import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TriageResult, Appointment, Doctor } from '@/lib/types';
import { mockAppointments } from '@/lib/mock-data';

interface AppState {
  triageResult: TriageResult | null;
  setTriageResult: (r: TriageResult | null) => void;
  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (d: Doctor | null) => void;
  symptomInput: string;
  setSymptomInput: (s: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [symptomInput, setSymptomInput] = useState('');

  const addAppointment = (a: Appointment) => setAppointments(prev => [a, ...prev]);

  return (
    <AppContext.Provider value={{ triageResult, setTriageResult, appointments, addAppointment, selectedDoctor, setSelectedDoctor, symptomInput, setSymptomInput }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
