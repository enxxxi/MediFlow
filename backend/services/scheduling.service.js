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

// Main scheduling function
export function scheduleAppointment(patientCase = {}) {
  const triageLevel = normalizeTriageLevel(patientCase.triage_level);
  const department = getDepartment(patientCase.symptoms || []);

  // Emergency cases should not continue with normal appointment booking
  if (triageLevel === "EMERGENCY") {
    return {
      department: "Emergency Department",
      doctor: null,
      time: "Immediate",
      priority_level: 1,
      status: "redirected",
      instructions: "Proceed to the nearest emergency department immediately.",
      booking_type: "emergency_redirect",
    };
  }

  const doctor = getBestDoctor(department);

  if (!doctor) {
    return {
      department,
      doctor: null,
      time: null,
      priority_level: getPriority(triageLevel),
      status: "unavailable",
      instructions: "No doctor is currently available. Please assign manually.",
      booking_type: "manual_review",
    };
  }

  const availableSlots = slots[doctor.name] || [];
  const assignedSlot = availableSlots.length > 0 ? availableSlots[0] : null;

  if (!assignedSlot) {
    return {
      department,
      doctor: doctor.name,
      time: null,
      priority_level: getPriority(triageLevel),
      status: "waitlisted",
      instructions: "No available slots for this doctor yet. Please wait for the next available appointment.",
      booking_type: "waitlist",
    };
  }

  return {
    department,
    doctor: doctor.name,
    time: assignedSlot,
    priority_level: getPriority(triageLevel),
    status: "confirmed",
    instructions: "Please arrive 15 minutes early and bring any relevant medical documents.",
    booking_type: "scheduled",
  };
}