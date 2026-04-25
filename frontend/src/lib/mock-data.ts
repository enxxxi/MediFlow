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
    address: 'Suite G-02, Ground Floor, Menara Shell, Jalan Tun Sambanthan, 50470 Kuala Lumpur.',
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
    address: 'Suite 5-12, Level 5, Gleneagles Hospital Kuala Lumpur, 282, Jalan Ampang, 50450 Kuala Lumpur.',
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
    address: 'Room B-204, Block B, Pantai Hospital Kuala Lumpur, 8, Jalan Bukit Pantai, 59100 Kuala Lumpur.',
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
    address: 'No. 45, Jalan SS B/2, Taman SEA, 47300 Petaling Jaya, Selangor.',
  },
  {
    id: '5',
    name: 'Dr. Siti Aminah',
    specialty: 'Pediatrician',
    avatar: '👩‍⚕️',
    rating: 4.9,
    nextAvailable: 'Today, 4:00 PM',
    slots: ['4:00 PM', '4:30 PM', '5:00 PM'],
    hospital: 'KPJ Ampang Puteri Specialist',
    address: '1, Jalan Memanda 9, Taman Dato Ahmad Razali, 68000 Ampang, Selangor',
  },
  {
    id: '6',
    name: 'Dr. Kevin Wong',
    specialty: 'Psychiatrist',
    avatar: '👨‍⚕️',
    rating: 4.6,
    nextAvailable: 'Monday, 10:00 AM',
    slots: ['10:00 AM', '11:30 AM', '2:00 PM'],
    hospital: 'MindHealth Wellness Center',
    address: 'L3-05, Bangsar Village II, Jalan Telawi 1, 59100 Kuala Lumpur',
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    doctor: mockDoctors[0],
    date: 'April 30, 2026',
    time: '2:30 PM',
    urgency: 'urgent',
    symptoms: ['Fever', 'Cough', 'Fatigue'],
    status: 'upcoming',
    purpose: 'Persistent high fever and respiratory assessment',
  },
  {
    id: 'a4',
    doctor: mockDoctors[4],
    date: 'May 12, 2026',
    time: '4:00 PM',
    urgency: 'non-urgent',
    symptoms: ['Childhood immunization'],
    status: 'upcoming',
    purpose: 'Routine 18-month vaccination and growth development milestone check.',
  },
  {
    id: 'a2',
    doctor: mockDoctors[3],
    date: 'April 18, 2026',
    time: '11:00 AM',
    urgency: 'non-urgent',
    symptoms: ['Skin rash'],
    status: 'completed',
    purpose: 'Dermatological review of allergic reaction',
  },
  {
    id: 'a5',
    doctor: mockDoctors[1],
    date: 'April 05, 2026',
    time: '09:00 AM',
    urgency: 'urgent',
    symptoms: ['Palpitations', 'Dizziness'],
    status: 'completed',
    purpose: 'Follow-up EKG scan to monitor heart rhythm stability after medication change.',
  },
  {
    id: 'a6',
    doctor: mockDoctors[2],
    date: 'March 22, 2026',
    time: '02:00 PM',
    urgency: 'non-urgent',
    symptoms: ['Shortness of breath'],
    status: 'completed',
    purpose: 'Post-recovery lung function test and asthma management plan review.',
  },
  {
    id: 'a3',
    doctor: mockDoctors[1],
    date: 'April 10, 2026',
    time: '09:00 AM',
    urgency: 'non-urgent',
    symptoms: ['Chest tightness'],
    status: 'completed',
    purpose: 'Routine EKG and heart rate monitoring', 
  }
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
