import express from "express";
import workflowRoutes from "./routes/workflow.routes.js";
import agentRoutes from "./routes/agent.routes.js";

const app = express();

app.use(express.json());

// routes
app.use("/workflow", workflowRoutes);
app.use("/agent", agentRoutes);

// health check
app.get("/", (req, res) => {
  res.json({ message: "MediFlow backend running" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

