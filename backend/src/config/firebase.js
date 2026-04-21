import admin from "firebase-admin";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}

console.log("FIRESTORE_EMULATOR_HOST =", process.env.FIRESTORE_EMULATOR_HOST);

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "mediflow-dev",
  });
}

const db = admin.firestore();

export { admin, db };