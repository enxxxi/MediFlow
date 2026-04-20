import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load JSON manually
function loadJSON(fileName) {
  const filePath = path.join(__dirname, `../data/${fileName}`);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// load datasets
const doctors = loadJSON("doctors.json");
const slots = loadJSON("slots.json");
const deptRules = loadJSON("departmentRules.json");

// map symptoms → department
function getDepartment(symptoms = []) {
  for (const symptom of symptoms) {
    if (deptRules[symptom]) {
      return deptRules[symptom];
    }
  }
  return "General";
}

// urgency → priority
function getPriority(triage_level) {
  if (triage_level === "Emergency") return 1;
  if (triage_level === "Urgent") return 2;
  return 3;
}

// main scheduling function
export function scheduleAppointment(patientCase) {
  const department = getDepartment(patientCase.symptoms);
  const doctorList = doctors[department] || doctors["General"];

  const doctor = [...doctorList].sort((a, b) => a.priority - b.priority)[0];

  const availableSlots = slots[doctor.name] || [];
  const assignedSlot = availableSlots.length > 0 ? availableSlots[0] : "TBD";

  return {
    department,
    doctor: doctor.name,
    time: assignedSlot,
    priority_level: getPriority(patientCase.triage_level),
    status: "confirmed"
  };
}