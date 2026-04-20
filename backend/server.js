import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import workflowRoutes from "./routes/workflow.routes.js";
import agentRoutes from "./routes/agent.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/workflow", workflowRoutes);
app.use("/api/agent", agentRoutes);

// health check
app.get("/", (req, res) => {
  res.json({ message: "MediFlow backend running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});