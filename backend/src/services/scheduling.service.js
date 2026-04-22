import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON manually
function loadJSON(fileName) {
  const filePath = path.join(__dirname, `../data/${fileName}`);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Load datasets
const doctors = loadJSON("doctors.json");
const slots = loadJSON("slots.json");
const deptRules = loadJSON("departmentRules.json");

// Normalize triage level
function normalizeTriageLevel(triageLevel) {
  return String(triageLevel || "").trim().toUpperCase();
}

// Map symptoms → department
function getDepartment(symptoms = []) {
  for (const symptom of symptoms) {
    if (deptRules[symptom]) {
      return deptRules[symptom];
    }
  }
  return "General";
}

// Triage → priority
function getPriority(triageLevel) {
  const normalized = normalizeTriageLevel(triageLevel);

  if (normalized === "EMERGENCY") return 1;
  if (normalized === "URGENT") return 2;
  return 3;
}

// Find best available doctor
function getBestDoctor(department) {
  const doctorList = doctors[department] || doctors["General"] || [];

  if (!Array.isArray(doctorList) || doctorList.length === 0) {
    return null;
  }

  return [...doctorList].sort((a, b) => a.priority - b.priority)[0];
}

function parseSlotTime(slot) {
  const match = String(slot).match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

function formatSlotDecision(date, slot) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-MY");

  return `${dayLabel} ${slot}`;
}

function getDatedSlot(slot) {
  const parsedSlot = parseSlotTime(slot);

  if (!parsedSlot) {
    return null;
  }

  const now = new Date();
  const slotDate = new Date(now);
  slotDate.setHours(parsedSlot.hours, parsedSlot.minutes, 0, 0);

  if (slotDate <= now) {
    slotDate.setDate(slotDate.getDate() + 1);
  }

  return {
    rawSlot: slot,
    date: slotDate,
    label: formatSlotDecision(slotDate, slot),
  };
}

function selectAppointmentSlot(triageLevel, availableSlots = []) {
  const datedSlots = availableSlots
    .map(getDatedSlot)
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (datedSlots.length === 0) {
    return null;
  }

  if (triageLevel === "URGENT") {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(now.getHours() + 24);

    const urgentSlot = datedSlots.find((slot) => slot.date <= deadline);
    return urgentSlot ? urgentSlot.label : null;
  }

  return datedSlots[0].label;
}

// Build patient summary for final output
function getPatientSummary(patientCase = {}) {
  const symptoms = Array.isArray(patientCase.symptoms)
    ? patientCase.symptoms.join(", ")
    : patientCase.symptoms || "not specified";

  const duration = patientCase.duration || "not specified";
  const severity = patientCase.severity || "not specified";

  return `Patient reports ${symptoms}. Duration: ${duration}. Severity: ${severity}.`;
}

function createNotification({ status, department, doctor, appointmentTime, instructions }) {
  let message;

  if (status === "redirected") {
    message = `Emergency case detected. ${instructions}`;
  } else if (status === "confirmed") {
    message = `Appointment confirmed with ${doctor} at ${appointmentTime}. Department: ${department}. ${instructions}`;
  } else if (status === "waitlisted") {
    message = `You have been placed on the waitlist for ${department}. ${instructions}`;
  } else {
    message = `${department} appointment requires manual review. ${instructions}`;
  }

  return {
    type: "SMS_SIMULATION",
    status: "ready_to_send",
    message,
  };
}

// Main scheduling function
export function scheduleAppointment(patientCase = {}) {
  const triageLevel = normalizeTriageLevel(patientCase.triage_level);
  const department = getDepartment(patientCase.symptoms || []);
  const patientSummary = getPatientSummary(patientCase);

  // Emergency cases should not continue with normal appointment booking
  if (triageLevel === "EMERGENCY") {
    const instructions = "Proceed to the nearest emergency department immediately.";

    return {
      patient_summary: patientSummary,
      triage_level: triageLevel,
      department: "Emergency Department",
      doctor: null,
      appointment_time: "Immediate",
      priority_level: 1,
      status: "redirected",
      instructions,
      booking_type: "emergency_redirect",
      notification: createNotification({
        status: "redirected",
        department: "Emergency Department",
        doctor: null,
        appointmentTime: "Immediate",
        instructions,
      }),
    };
  }

  const doctor = getBestDoctor(department);

  if (!doctor) {
    const instructions = "No doctor is currently available. Please assign manually.";

    return {
      patient_summary: patientSummary,
      triage_level: triageLevel,
      department,
      doctor: null,
      appointment_time: null,
      priority_level: getPriority(triageLevel),
      status: "unavailable",
      instructions,
      booking_type: "manual_review",
      notification: createNotification({
        status: "unavailable",
        department,
        doctor: null,
        appointmentTime: null,
        instructions,
      }),
    };
  }

  const availableSlots = slots[doctor.name] || [];
  const assignedSlot = selectAppointmentSlot(triageLevel, availableSlots);

  if (!assignedSlot) {
    const instructions = "No available slots for this doctor yet. Please wait for the next available appointment.";

    return {
      patient_summary: patientSummary,
      triage_level: triageLevel,
      department,
      doctor: doctor.name,
      appointment_time: null,
      priority_level: getPriority(triageLevel),
      status: "waitlisted",
      instructions,
      booking_type: "waitlist",
      notification: createNotification({
        status: "waitlisted",
        department,
        doctor: doctor.name,
        appointmentTime: null,
        instructions,
      }),
    };
  }

  const instructions = "Please arrive 15 minutes early and bring any relevant medical documents.";

  return {
    patient_summary: patientSummary,
    triage_level: triageLevel,
    department,
    doctor: doctor.name,
    appointment_time: assignedSlot,
    priority_level: getPriority(triageLevel),
    status: "confirmed",
    instructions,
    booking_type: "scheduled",
    notification: createNotification({
      status: "confirmed",
      department,
      doctor: doctor.name,
      appointmentTime: assignedSlot,
      instructions,
    }),
  };
}
