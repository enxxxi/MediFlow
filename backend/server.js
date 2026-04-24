import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import workflowRoutes from "./src/routes/workflow.routes.js";
import agentRoutes from "./src/routes/agent.routes.js";

dotenv.config({ override: true });
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/workflow", workflowRoutes);
app.use("/api/agent", agentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "MediFlow backend running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});