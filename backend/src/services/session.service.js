import { db } from "../config/firebase.js";

const SESSIONS_COLLECTION = "workflow_sessions";

function getSessionRef(sessionId) {
  return db.collection(SESSIONS_COLLECTION).doc(String(sessionId));
}

export async function getAllSessions() {
  try {
    const snapshot = await db
      .collection(SESSIONS_COLLECTION)
      .orderBy("created_at", "desc")
      .get();

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Failed to get all sessions:", error.message);
    return [];
  }
}

export async function getSessionById(sessionId) {
  try {
    const snapshot = await getSessionRef(sessionId).get();
    return snapshot.exists ? snapshot.data() : null;
  } catch (error) {
    console.error("Failed to get session by id:", error.message);
    return null;
  }
}

export async function saveSession(session) {
  try {
    await getSessionRef(session.session_id).set(session);
    console.log(`Session saved: ${session.session_id}`);
    return session;
  } catch (error) {
    console.error("Critical save error:", error);
    throw new Error("Unable to save session data");
  }
}

export async function updateSession(sessionId, updatedData) {
  try {
    const ref = getSessionRef(sessionId);
    const snapshot = await ref.get();

    if (!snapshot.exists) return null;

    const currentSession = snapshot.data();
    const mergedSession = {
      ...currentSession,
      ...updatedData,
      session_id: currentSession.session_id,
      updated_at: new Date().toISOString(),
    };

    await ref.set(mergedSession);
    return mergedSession;
  } catch (error) {
    console.error("Failed to update session:", error.message);
    throw new Error("Unable to update session data");
  }
}
