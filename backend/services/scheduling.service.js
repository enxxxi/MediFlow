import doctors from "../data/doctors.json" with { type: "json" };
import symptomMap from "../data/symptom_map.json" with { type: "json" };

// 1. Get department from symptoms
function getDepartment(symptoms) {
  for (let symptom of symptoms) {
    if (symptomMap[symptom]) {
      return symptomMap[symptom];
    }
  }
  return "General Medicine";
}

// 2. Pick doctor
function getDoctor(department) {
  return doctors[department][0]; // simple version
}

// 3. Get slot
function getSlot(doctor) {
  return doctor.slots[0]; // earliest slot
}

// MAIN FUNCTION
export function createAppointment(data) {
  const department = getDepartment(data.symptoms);
  const doctor = getDoctor(department);
  const slot = getSlot(doctor);

  return {
    status: "confirmed",
    department,
    doctor: doctor.name,
    appointment_time: slot,
    triage_level: data.triage_level,
    risk_score: data.risk_score,
    message: "Appointment scheduled successfully"
  };
}