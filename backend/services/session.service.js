const fs = require("fs");
const path = require("path");

const sessionsFile = path.join(__dirname, "../data/sessions.json");

function readSessions() {
  try {
    const data = fs.readFileSync(sessionsFile, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    return [];
  }
}

function writeSessions(sessions) {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

function getAllSessions() {
  return readSessions();
}

function getSessionById(sessionId) {
  const sessions = readSessions();
  return sessions.find((session) => session.session_id === sessionId);
}

function saveSession(newSession) {
  const sessions = readSessions();
  sessions.push(newSession);
  writeSessions(sessions);
  return newSession;
}

function updateSession(sessionId, updatedData) {
  const sessions = readSessions();
  const index = sessions.findIndex((session) => session.session_id === sessionId);

  if (index === -1) return null;

  sessions[index] = {
    ...sessions[index],
    ...updatedData,
  };

  writeSessions(sessions);
  return sessions[index];
}

module.exports = {
  getAllSessions,
  getSessionById,
  saveSession,
  updateSession,
};