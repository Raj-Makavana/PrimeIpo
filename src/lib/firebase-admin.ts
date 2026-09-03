import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      // Handle both literal newlines and escaped \n
      privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    }

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } catch (error) {
    console.warn('Firebase Admin init notice:', error);
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
