import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionsFile = path.join(__dirname, "../data/sessions.json");

export function readSessions() {
  try {
    if (!fs.existsSync(sessionsFile)) {
      return [];
    }

    const data = fs.readFileSync(sessionsFile, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read sessions:", error.message);
    return [];
  }
}

export function writeSessions(sessions) {
  try {
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write sessions:", error.message);
    throw new Error("Unable to save session data");
  }
}

export function getAllSessions() {
  return readSessions();
}

export function getSessionById(sessionId) {
  const sessions = readSessions();
  return sessions.find((session) => session.session_id === sessionId) || null;
}

export function saveSession(newSession) {
  const sessions = readSessions();
  sessions.push(newSession);
  writeSessions(sessions);
  return newSession;
}

export function updateSession(sessionId, updatedData) {
  const sessions = readSessions();
  const index = sessions.findIndex(
    (session) => session.session_id === sessionId
  );

  if (index === -1) return null;

  sessions[index] = {
    ...sessions[index],
    ...updatedData,
    session_id: sessions[index].session_id,
    updated_at: new Date().toISOString(),
  };

  writeSessions(sessions);
  return sessions[index];
}