export type UrgencyLevel = 'emergency' | 'urgent' | 'non-urgent';

export interface TriageResult {
  urgency: UrgencyLevel;
  riskExplanation: string;
  confidenceScore: number;
  symptoms: string[];
  suggestedSpecialty: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  nextAvailable: string;
  slots: string[];
  hospital: string;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  urgency: UrgencyLevel;
  symptoms: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface MedicalCase {
  symptoms: string[];
  severity: number;
  duration: string;
  description: string;
  riskFlags: string[];
  urgency: UrgencyLevel;
  confidence: number;
}
