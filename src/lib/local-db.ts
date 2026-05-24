
"use client"

import Dexie, { type Table } from 'dexie';

export interface LocalImage {
  id: string;
  userId: string;
  kind: 'face' | 'figure' | 'avatar' | 'wardrobe' | 'tryon' | 'grooming';
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface LocalProfile {
  userId: string;
  data: any; // Perfil liviano
  updatedAt: number;
}

export interface LocalAnalysis {
  id: string;
  userId: string;
  type: 'biometric' | 'colorimetry' | 'figure';
  data: any;
  createdAt: number;
}

export class EstilizaLocalDB extends Dexie {
  images!: Table<LocalImage>;
  profiles!: Table<LocalProfile>;
  analyses!: Table<LocalAnalysis>;

  constructor() {
    super('EstilizaLocalDB');
    this.version(1).stores({
      images: 'id, userId, kind, createdAt',
      profiles: 'userId, updatedAt',
      analyses: 'id, userId, type, createdAt'
    });
  }
}

export const db = new EstilizaLocalDB();

/**
 * Utilidad para convertir DataURI (Base64) a Blob para IndexedDB
 */
export function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Utilidad para convertir Blob a DataURI (URL.createObjectURL es preferible para visualización)
 */
export function blobToDataURI(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Estimación de almacenamiento
 */
export async function logStorageStatus() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const percent = ((usage || 0) / (quota || 1) * 100).toFixed(2);
    console.log(`IndexedDB Storage Usage: ${percent}% (${(usage || 0) / 1024 / 1024}MB / ${(quota || 0) / 1024 / 1024}MB)`);
    if (parseFloat(percent) > 80) {
      console.warn("ADVERTENCIA: El almacenamiento local está superando el 80% de capacidad.");
    }
  }

  if (navigator.storage && navigator.storage.persist) {
    const persisted = await navigator.storage.persist();
    console.log("Persistent storage granted:", persisted);
  }
}
