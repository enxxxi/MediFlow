import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Persist local session snapshots in a dedicated directory.
const SESSIONS_DIR = path.join(__dirname, '../../sessions-data');

function ensureSessionsDir() {
  if (fs.existsSync(SESSIONS_DIR)) {
    const existingPathStat = fs.statSync(SESSIONS_DIR);
    if (!existingPathStat.isDirectory()) {
      throw new Error(`Session path exists but is not a directory: ${SESSIONS_DIR}`);
    }
    return;
  }

  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

function getSessionFilePath(sessionId) {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

export async function getAllSessions() {
  try {
    ensureSessionsDir();

    const files = fs
      .readdirSync(SESSIONS_DIR)
      .filter((fileName) => fileName.endsWith('.json'));

    const sessions = files
      .map((fileName) => {
        const raw = fs.readFileSync(path.join(SESSIONS_DIR, fileName), 'utf8');
        return JSON.parse(raw);
      })
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });

    return sessions;
  } catch (error) {
    console.error("Failed to get all sessions:", error.message);
    return [];
  }
}

export async function getSessionById(sessionId) {
  try {
    ensureSessionsDir();
    const filePath = getSessionFilePath(sessionId);

    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to get session by id:", error.message);
    return null;
  }
}

export const saveSession = async (session) => {
  try {
    ensureSessionsDir();

    const filePath = path.join(SESSIONS_DIR, `${session.session_id}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
    console.log(`✅ Session saved: ${session.session_id}`);
    
    return session;
  } catch (error) {
    console.error("❌ Critical Save Error:", error);
    throw new Error("Unable to save session data");
  }
};

export async function updateSession(sessionId, updatedData) {
  try {
    ensureSessionsDir();
    const filePath = getSessionFilePath(sessionId);

    if (!fs.existsSync(filePath)) return null;

    const currentSession = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const mergedSession = {
      ...currentSession,
      ...updatedData,
      session_id: currentSession.session_id,
      updated_at: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(mergedSession, null, 2), 'utf8');
    return mergedSession;
  } catch (error) {
    console.error("Failed to update session:", error.message);
    throw new Error("Unable to update session data");
  }
}