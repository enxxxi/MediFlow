import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Stethoscope } from "lucide-react";
import { toast } from "sonner";

type WorkflowResponse = {
  success: boolean;
  message: string;
  data?: {
    session_id: string;
    current_step: string;
    completed_steps: string[];
    patient_case: Record<string, unknown>;
    pending_fields: string[];
    question_history: Array<{
      field: string;
      question: string;
      answer: string | number | null;
      asked_at: string;
      answered_at: string | null;
    }>;
    last_question: string | null;
    last_question_field: string | null;
    case_summary: string | null;
    validation_error?: string | null;
    resume_message?: string | null;
    next_question?: string | null;
  };
};

export default function Triage() {
  const navigate = useNavigate();

  const [symptomInput, setSymptomInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<WorkflowResponse["data"] | null>(null);

  const [uiStep, setUiStep] = useState<"input" | "analyzing" | "followup">("input");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const API_BASE = "http://localhost:5000/api/workflow";

  const startWorkflow = async () => {
    if (!symptomInput.trim()) {
      setErrorMessage("Please enter your symptoms first.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setUiStep("analyzing");

      // --- CRITICAL UPDATE: Ensure this matches your Node.js route ---
      const response = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: symptomInput.trim(), // Member 2 will parse this messy string
          triage_level: "URGENT", 
        }),
      });

      const data: WorkflowResponse = await response.json();

      if (!data.success || !data.data) {
        setErrorMessage(data.message || "Failed to start workflow.");
        setUiStep("input");
        return;
      }

      // Member 2 Result: Setting the session and the first AI question
      setSessionId(data.data.session_id);
      setWorkflowData(data.data);
      setCurrentQuestion(data.data.last_question ?? null);
      setUiStep("followup");
      
    } catch (error) {
      setErrorMessage("Unable to connect to backend. Is Node.js running on port 5000?");
      setUiStep("input");
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async () => {
    // 1. Guard Clauses: Ensure we have a session and an actual answer
    if (!sessionId) {
      setErrorMessage("Session expired or not found. Please restart the triage.");
      return;
    }

    if (!answerInput.trim()) {
      setErrorMessage("Please type an answer before submitting.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      // 2. The Data Bridge: Sending the answer to your Node.js Workflow API
      const response = await fetch(`${API_BASE}/answer/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: answerInput.trim(),
        }),
      });

      const data: WorkflowResponse = await response.json();

      // 3. Validation Handling: If Z.AI didn't understand the answer or it was invalid
      if (!data.success && data.data) {
        setWorkflowData(data.data);
        // Keep the user on the same question if validation failed
        setCurrentQuestion(data.data.last_question || data.data.next_question || null);
        setErrorMessage(data.message || data.data.validation_error || "Invalid input received.");
        return;
      }

      // 4. Critical Failure Check
      if (!data.success || !data.data) {
        setErrorMessage(data.message || "Failed to submit answer to the server.");
        return;
      }

      // 5. State Update: Save the new workflow state
      setWorkflowData(data.data);
      setAnswerInput(""); // Clear the input box for the next question

      // 6. The Decision Layer (Member 2's Logic)
      if (data.data.current_step === "ASKING_FOLLOWUP") {
        // Update the UI with the next question from the AI
        setCurrentQuestion(data.data.next_question || data.data.last_question || null);
        toast.success("Info updated. Next question...");
      } 
      
      else if (data.data.current_step === "READY_FOR_SCHEDULING") {
        // Task Completed: Pass the structured medical case to the Result page
        toast.success("Analysis complete!");
        navigate("/triage-result", {
          state: {
            sessionId: data.data.session_id,
            workflow: data.data,
            patientCase: data.data.patient_case, // This is the 'Source of Truth'
          },
        });
      }

    } catch (error) {
      console.error("Workflow Connection Error:", error);
      setErrorMessage("Unable to connect to the backend. Please ensure your Node.js server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (uiStep === "input") {
      await startWorkflow();
    } else if (uiStep === "followup") {
      await sendAnswer();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/15 p-3">
              <Stethoscope className="text-cyan-300" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Triage</h1>
              <p className="text-sm text-white/60">
                Detected: {Array.isArray(workflowData?.patient_case?.symptoms) 
                  ? workflowData.patient_case.symptoms.join(", ") 
                  : "Processing..."}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {uiStep === "input" && (
            <div className="space-y-4">
              <label className="block text-sm text-white/70">
                What symptoms are you experiencing?
              </label>
              <textarea
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="Example: fever, cough, headache"
                className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
              <button
                onClick={handlePrimaryAction}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {loading ? "Starting..." : "Start Triage"}
              </button>
            </div>
          )}

          {uiStep === "analyzing" && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
              <p className="text-lg font-medium">Starting workflow...</p>
              <p className="mt-2 text-sm text-white/60">
                Preparing your triage session.
              </p>
            </div>
          )}

          {uiStep === "followup" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-cyan-300">
                  Current Question
                </p>
                <p className="text-lg font-medium">
                  {currentQuestion || "No question available."}
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm text-white/70">
                  Your answer
                </label>
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Type your answer here"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handlePrimaryAction}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                  {loading ? "Submitting..." : "Submit Answer"}
                </button>
              </div>

              {workflowData && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-sm font-semibold text-white/80">
                    Workflow Status
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-900 px-4 py-3">
                      <p className="text-xs text-white/50">Session ID</p>
                      <p className="mt-1 break-all text-sm">{workflowData.session_id}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900 px-4 py-3">
                      <p className="text-xs text-white/50">Current Step</p>
                      <p className="mt-1 text-sm">{workflowData.current_step}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900 px-4 py-3">
                      <p className="text-xs text-white/50">Pending Fields</p>
                      <p className="mt-1 text-sm">
                        {workflowData.pending_fields.length > 0
                          ? workflowData.pending_fields.join(", ")
                          : "None"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-900 px-4 py-3">
                      <p className="text-xs text-white/50">Completed Steps</p>
                      <p className="mt-1 text-sm">
                        {workflowData.completed_steps.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}