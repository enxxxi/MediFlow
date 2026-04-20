import express from "express";
import scheduleRoutes from "../routes/schedule.routes.js";

const app = express();

app.use(express.json());
app.use("/api", scheduleRoutes);

export default app;