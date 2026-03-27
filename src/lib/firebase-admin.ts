import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getPrivateKey() {
  const privateKey =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ??
    process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
  return privateKey?.replace(/\\n/g, "\n");
}

function createFirebaseAdminApp(): App {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ??
    process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin config incompleta. Define FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY (o sus fallback NEXT_PUBLIC_FIREBASE_*)."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function getFirebaseAdminApp(): App {
  return getApps().length ? getApps()[0] : createFirebaseAdminApp();
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
