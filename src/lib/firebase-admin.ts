import * as admin from 'firebase-admin';

/**
 * Inicialización segura del Firebase Admin SDK.
 * Se encarga de limpiar el nombre del bucket para evitar el error de prefijo gs://
 */
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
  
  // Eliminamos gs:// si existe para evitar errores en el Admin SDK
  const cleanBucket = rawBucket.replace(/^gs:\/\//, '');

  admin.initializeApp({
    projectId: projectId,
    storageBucket: cleanBucket
  });
}

export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
