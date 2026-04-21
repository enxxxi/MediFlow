import { db } from "../config/firebase.js";

const COLLECTION_NAME = "workflow_sessions";

export async function getAllSessions() {
  try {
    const snapshot = await db
      .collection(COLLECTION_NAME)
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
    const doc = await db.collection(COLLECTION_NAME).doc(sessionId).get();

    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    console.error("Failed to get session by id:", error.message);
    return null;
  }
}

export async function saveSession(newSession) {
  try {
    await db.collection(COLLECTION_NAME).doc(newSession.session_id).set(newSession);
    return newSession;
  } catch (error) {
    console.error("Failed to save session:", error.message);
    throw new Error("Unable to save session data");
    console.log("Saving session:", newSession.session_id);
  }
}

export async function updateSession(sessionId, updatedData) {
  try {
    const ref = db.collection(COLLECTION_NAME).doc(sessionId);
    const doc = await ref.get();

    if (!doc.exists) return null;

    const currentSession = doc.data();

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