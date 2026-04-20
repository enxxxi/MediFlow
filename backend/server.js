const express = require("express");
const cors = require("cors");
const workflowRoutes = require("./routes/workflow.routes");
const agentRoutes = require("./routes/agent.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/workflow", workflowRoutes);
app.use("/api/agent", agentRoutes);

app.get("/", (req, res) => {
    res.send("MediFlow backend running");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});