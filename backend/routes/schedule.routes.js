import express from "express";
import { scheduleAppointment } from "../src/controllers/schedule.controller.js";

const router = express.Router();

router.post("/schedule", scheduleAppointment);

export default router;