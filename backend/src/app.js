import express from "express";
import cors from "cors";
import scheduleRoutes from "../routes/schedule.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", scheduleRoutes);

export default app;