import admin from "firebase-admin";
import { config } from "../config/index.js";

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]!;
    return firebaseApp;
  }

  // Initialize Firebase Admin SDK
  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
  } else {
    // For development without Firebase credentials
    console.warn("⚠️ Firebase credentials not configured. Auth will be mocked in development.");
    firebaseApp = admin.initializeApp({
      projectId: "demo-project",
    });
  }

  return firebaseApp;
}

export function getAuth(): admin.auth.Auth {
  const app = initializeFirebase();
  return admin.auth(app);
}

export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getAuth();
  return auth.verifyIdToken(token);
}

export async function createFirebaseUser(
  email: string,
  password?: string
): Promise<admin.auth.UserRecord> {
  const auth = getAuth();
  
  const userRecord = await auth.createUser({
    email,
    password: password || generateTempPassword(),
    emailVerified: false,
  });

  // Generate password reset link for the user
  const resetLink = await auth.generatePasswordResetLink(email);
  console.log(`Password reset link for ${email}: ${resetLink}`);

  return userRecord;
}

export async function deleteFirebaseUser(uid: string): Promise<void> {
  const auth = getAuth();
  await auth.deleteUser(uid);
}

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-12) + "A1!";
}

// Initialize Firebase on module load
initializeFirebase();

