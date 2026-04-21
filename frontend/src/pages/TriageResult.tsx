import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarCheck, ShieldAlert, Stethoscope } from "lucide-react";

type WorkflowData = {
  session_id: string;
  current_step: string;
  completed_steps: string[];
  patient_case: {
    symptoms?: string[];
    triage_level?: string;
    duration?: string;
    severity?: number | string;
    breathing_difficulty?: string;
    age_group?: string;
  };
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
  appointment_result?: {
    department: string;
    doctor: string | null;
    time: string | null;
    priority_level: number;
    status: string;
    instructions: string;
    booking_type: string;
  };
};

type FinalizeResponse = {
  success: boolean;
  message: string;
  data?: WorkflowData;
};

export default function TriageResult() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as
    | {
        sessionId?: string;
        workflow?: WorkflowData;
      }
    | undefined;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultData, setResultData] = useState<WorkflowData | null>(
    state?.workflow ?? null
  );

  const sessionId = state?.sessionId ?? state?.workflow?.session_id ?? null;
  const API_BASE = "http://localhost:5000/api/workflow";

  useEffect(() => {
    if (!sessionId || !resultData) {
      navigate("/triage");
      return;
    }

    const finalizeWorkflow = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_BASE}/finalize/${sessionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data: FinalizeResponse = await response.json();

        if (!data.success || !data.data) {
          setErrorMessage(data.message || "Failed to finalize appointment.");
          return;
        }

        setResultData(data.data);
      } catch (error) {
        setErrorMessage("Unable to connect to backend.");
      } finally {
        setLoading(false);
      }
    };

    // only finalize if workflow is ready and not already completed
    if (resultData.current_step === "READY_FOR_SCHEDULING") {
      finalizeWorkflow();
    } else if (resultData.current_step === "COMPLETED") {
      setLoading(false);
    } else {
      setErrorMessage("Workflow is not ready for final result.");
      setLoading(false);
    }
  }, [sessionId, resultData, navigate]);

  if (!sessionId || !resultData) {
    return null;
  }

  const triageLevel = String(
    resultData.patient_case?.triage_level || "UNKNOWN"
  ).toUpperCase();

  const isEmergency = triageLevel === "EMERGENCY";
  const symptoms = resultData.patient_case?.symptoms || [];
  const appointment = resultData.appointment_result;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/triage")}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          <ArrowLeft size={16} />
          Back to Triage
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
              <h1 className="text-2xl font-bold">Triage Result</h1>
              <p className="text-sm text-white/60">
                Final assessment and scheduling result.
              </p>
            </div>
          </div>

          {loading && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
              <p className="text-lg font-medium">Finalizing appointment...</p>
              <p className="mt-2 text-sm text-white/60">
                Please wait while we complete scheduling.
              </p>
            </div>
          )}

          {!loading && errorMessage && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {!loading && !errorMessage && (
            <div className="space-y-6">
              <div
                className={`rounded-2xl border p-5 ${
                  isEmergency
                    ? "border-red-400/30 bg-red-500/10"
                    : "border-cyan-400/20 bg-cyan-500/10"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isEmergency ? (
                      <ShieldAlert className="text-red-300" size={20} />
                    ) : (
                      <CalendarCheck className="text-cyan-300" size={20} />
                    )}
                    <h2 className="text-lg font-semibold">
                      {isEmergency ? "Emergency Case" : "Assessment Completed"}
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium">
                    {triageLevel}
                  </span>
                </div>

                <p className="text-sm text-white/80">
                  {resultData.case_summary || "No case summary available."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white/80">
                    Patient Case
                  </h3>
                  <div className="space-y-2 text-sm text-white/75">
                    <p>
                      <span className="text-white/50">Symptoms:</span>{" "}
                      {symptoms.length ? symptoms.join(", ") : "Not provided"}
                    </p>
                    <p>
                      <span className="text-white/50">Duration:</span>{" "}
                      {resultData.patient_case?.duration || "Not provided"}
                    </p>
                    <p>
                      <span className="text-white/50">Severity:</span>{" "}
                      {String(resultData.patient_case?.severity ?? "Not provided")}
                    </p>
                    {resultData.patient_case?.breathing_difficulty && (
                      <p>
                        <span className="text-white/50">
                          Breathing difficulty:
                        </span>{" "}
                        {resultData.patient_case.breathing_difficulty}
                      </p>
                    )}
                    {resultData.patient_case?.age_group && (
                      <p>
                        <span className="text-white/50">Age group:</span>{" "}
                        {resultData.patient_case.age_group}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white/80">
                    Appointment Result
                  </h3>

                  {appointment ? (
                    <div className="space-y-2 text-sm text-white/75">
                      <p>
                        <span className="text-white/50">Department:</span>{" "}
                        {appointment.department}
                      </p>
                      <p>
                        <span className="text-white/50">Doctor:</span>{" "}
                        {appointment.doctor || "Not assigned"}
                      </p>
                      <p>
                        <span className="text-white/50">Time:</span>{" "}
                        {appointment.time || "Not available"}
                      </p>
                      <p>
                        <span className="text-white/50">Priority:</span>{" "}
                        {appointment.priority_level}
                      </p>
                      <p>
                        <span className="text-white/50">Status:</span>{" "}
                        {appointment.status}
                      </p>
                      <p>
                        <span className="text-white/50">Booking Type:</span>{" "}
                        {appointment.booking_type}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">
                      No appointment result available.
                    </p>
                  )}
                </div>
              </div>

              {appointment?.instructions && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="mb-2 text-sm font-semibold text-white/80">
                    Instructions
                  </h3>
                  <p className="text-sm text-white/75">
                    {appointment.instructions}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-3 text-sm font-semibold text-white/80">
                  Workflow Trace
                </h3>
                <div className="space-y-2 text-sm text-white/70">
                  <p>
                    <span className="text-white/50">Session ID:</span>{" "}
                    {resultData.session_id}
                  </p>
                  <p>
                    <span className="text-white/50">Current Step:</span>{" "}
                    {resultData.current_step}
                  </p>
                  <p>
                    <span className="text-white/50">Completed Steps:</span>{" "}
                    {resultData.completed_steps.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/triage")}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-medium text-white/80 hover:bg-white/5"
                >
                  Start New Triage
                </button>

                {isEmergency && (
                  <button
                    onClick={() => navigate("/emergency")}
                    className="rounded-2xl bg-red-500 px-5 py-3 font-medium text-white hover:bg-red-400"
                  >
                    Go to Emergency Actions
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}