import { Doctor, Appointment } from './types';

export const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    specialty: 'General Practitioner',
    avatar: '👩‍⚕️',
    rating: 4.9,
    nextAvailable: 'Today, 2:30 PM',
    slots: ['2:30 PM', '3:00 PM', '4:15 PM'],
    hospital: 'MediFlow Central Clinic',
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    specialty: 'Cardiologist',
    avatar: '👨‍⚕️',
    rating: 4.8,
    nextAvailable: 'Today, 3:00 PM',
    slots: ['3:00 PM', '5:00 PM'],
    hospital: 'HeartCare Medical Center',
  },
  {
    id: '3',
    name: 'Dr. Amara Osei',
    specialty: 'Pulmonologist',
    avatar: '👩‍⚕️',
    rating: 4.7,
    nextAvailable: 'Tomorrow, 9:00 AM',
    slots: ['9:00 AM', '10:30 AM', '1:00 PM'],
    hospital: 'City General Hospital',
  },
  {
    id: '4',
    name: 'Dr. Raj Patel',
    specialty: 'Dermatologist',
    avatar: '👨‍⚕️',
    rating: 4.9,
    nextAvailable: 'Tomorrow, 11:00 AM',
    slots: ['11:00 AM', '2:00 PM', '3:30 PM'],
    hospital: 'SkinWell Clinic',
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    doctor: mockDoctors[0],
    date: 'April 22, 2026',
    time: '2:30 PM',
    urgency: 'urgent',
    symptoms: ['Fever', 'Cough', 'Fatigue'],
    status: 'upcoming',
  },
  {
    id: 'a2',
    doctor: mockDoctors[3],
    date: 'April 18, 2026',
    time: '11:00 AM',
    urgency: 'non-urgent',
    symptoms: ['Skin rash'],
    status: 'completed',
  },
];

export function simulateTriageAnalysis(input: string) {
  const lower = input.toLowerCase();
  const hasEmergency = ['chest pain', 'breathing', 'unconscious', 'heart attack', 'stroke', 'severe bleeding'].some(k => lower.includes(k));
  const hasUrgent = ['fever', 'high temperature', 'vomiting', 'infection', 'swelling', 'sharp pain'].some(k => lower.includes(k));

  if (hasEmergency) {
    return {
      urgency: 'emergency' as const,
      riskExplanation: 'Your symptoms suggest a potentially life-threatening condition that requires immediate medical attention. Do not delay seeking emergency care.',
      confidenceScore: 92,
      symptoms: extractSymptoms(lower),
      suggestedSpecialty: 'Emergency Medicine',
    };
  }
  if (hasUrgent) {
    return {
      urgency: 'urgent' as const,
      riskExplanation: 'Your symptoms indicate a condition that should be evaluated by a healthcare provider today. While not immediately life-threatening, prompt medical attention is recommended.',
      confidenceScore: 85,
      symptoms: extractSymptoms(lower),
      suggestedSpecialty: 'General Practitioner',
    };
  }
  return {
    urgency: 'non-urgent' as const,
    riskExplanation: 'Your symptoms appear to be manageable and do not indicate an emergency. We recommend scheduling an appointment at your earliest convenience.',
    confidenceScore: 78,
    symptoms: extractSymptoms(lower),
    suggestedSpecialty: 'General Practitioner',
  };
}

function extractSymptoms(input: string): string[] {
  const all = ['fever', 'cough', 'headache', 'chest pain', 'fatigue', 'nausea', 'vomiting', 'rash', 'shortness of breath', 'sore throat', 'body aches', 'dizziness', 'swelling', 'sharp pain'];
  return all.filter(s => input.includes(s));
}
