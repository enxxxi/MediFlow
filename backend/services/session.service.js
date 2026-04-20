import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionsFile = path.join(__dirname, "../data/sessions.json");

export function readSessions() {
  try {
    const data = fs.readFileSync(sessionsFile, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    return [];
  }
}

export function writeSessions(sessions) {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

export function getAllSessions() {
  return readSessions();
}

export function getSessionById(sessionId) {
  const sessions = readSessions();
  return sessions.find((session) => session.session_id === sessionId);
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
  };

  writeSessions(sessions);
  return sessions[index];
}