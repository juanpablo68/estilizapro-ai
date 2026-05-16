
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`
  });
}

export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
