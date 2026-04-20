import { createAppointment } from "../../services/scheduling.service.js";

export function scheduleAppointment(req, res) {
  try {
    const result = createAppointment(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "Scheduling failed",
      details: err.message
    });
  }
}