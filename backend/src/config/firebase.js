import admin from "firebase-admin";

const rawUseFirestoreEmulator = String(
  process.env.USE_FIRESTORE_EMULATOR || ""
).trim().toLowerCase();
const shouldUseFirestoreEmulator = rawUseFirestoreEmulator === "true";
const credentialSource = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? `service-account-file:${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
  : process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
    ? "google-application-default-credentials"
    : "firebase-admin-default";

if (shouldUseFirestoreEmulator && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}

const resolvedProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "mediflow-f1701";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: resolvedProjectId,
  });
}

console.log("Firebase projectId =", resolvedProjectId);
console.log("USE_FIRESTORE_EMULATOR raw =", rawUseFirestoreEmulator || "not set");
console.log("Firebase credential source =", credentialSource);
console.log("Firestore target =", shouldUseFirestoreEmulator ? "emulator" : "production");
console.log(
  "FIRESTORE_EMULATOR_HOST =",
  process.env.FIRESTORE_EMULATOR_HOST || "not set"
);

const db = admin.firestore();

export { admin, db };
