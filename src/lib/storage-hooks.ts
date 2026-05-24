
"use client"

import { useState, useEffect } from 'react';
import { db, dataURItoBlob, logStorageStatus } from './local-db';

/**
 * Hook base para localStorage con manejo de errores de cuota.
 * Solo debe usarse para datos livianos.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      try {
        return JSON.parse(item);
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn("Cuota de localStorage excedida. Los datos pesados deberían estar en IndexedDB.");
      }
    }
  };

  return [storedValue, setValue] as const;
}

/**
 * Hook especializado para el perfil del usuario activo.
 * Sincroniza metadatos en localStorage e imágenes en IndexedDB.
 */
export function useUserScopedStorage<T>(baseKey: string, initialValue: T) {
  const [activeUser] = useLocalStorage<string>('estiliza_active_user', 'default');
  const activeUserSlug = typeof activeUser === 'string' ? activeUser.toLowerCase().replace(/\s+/g, '_') : 'default';
  const scopedKey = `${baseKey}_${activeUserSlug}`;
  
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      if (typeof window === "undefined") return;
      try {
        const item = window.localStorage.getItem(scopedKey);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          setStoredValue(initialValue);
        }
        await logStorageStatus();
      } catch (e) {
        setStoredValue(initialValue);
      }
    };
    load();
  }, [scopedKey, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Limpieza preventiva: Si el objeto contiene datos de imagen base64, los extraemos y avisamos
      const cleanValue = JSON.parse(JSON.stringify(valueToStore));
      const scanAndClean = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && obj[key].startsWith('data:image')) {
            console.warn(`Detección de imagen pesada en localStorage clave: ${key}. Debería migrarse a IndexedDB.`);
            // No lo borramos aquí para no romper la app de inmediato, pero logueamos
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            scanAndClean(obj[key]);
          }
        }
      };
      scanAndClean(cleanValue);

      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));
        console.log(`Metadatos guardados para usuario: ${activeUserSlug}`);
      }
    } catch (error: any) {
      console.error("Error al guardar perfil liviano:", error);
      if (error.name === 'QuotaExceededError') {
        alert("El almacenamiento del navegador está lleno. Intentando liberar espacio...");
      }
    }
  };

  return [storedValue, setValue] as const;
}

/**
 * Guardado de imagen pesada en IndexedDB
 */
export async function saveHeavyImage(userId: string, kind: LocalImage['kind'], dataUri: string, id?: string): Promise<string> {
  const imageId = id || `${kind}-${userId}-${Date.now()}`;
  try {
    const blob = dataURItoBlob(dataUri);
    await db.images.put({
      id: imageId,
      userId,
      kind,
      blob,
      mimeType: blob.type,
      createdAt: Date.now()
    });
    console.log(`Imagen pesada (${kind}) guardada en IndexedDB para: ${userId}`);
    return imageId;
  } catch (e) {
    console.error("Error al guardar en IndexedDB:", e);
    return "";
  }
}

/**
 * Carga de imagen desde IndexedDB
 */
export async function loadHeavyImage(imageId: string): Promise<string | null> {
  try {
    const img = await db.images.get(imageId);
    if (!img) return null;
    return URL.createObjectURL(img.blob);
  } catch (e) {
    console.error("Error al cargar desde IndexedDB:", e);
    return null;
  }
}

export interface WardrobeItem {
  id: string;
  name: string;
  type: string;
  imageDataUri: string; // En IndexedDB será el ID de la imagen
  dateAdded: string;
}

export interface UserProfile {
  name: string;
  gender: 'Femenino' | 'Masculino';
  stylePreferences: {
    favoriteColors: string[];
    preferredStyles: string[];
    dislikedStyles: string[];
    bodyPartsToAccentuate: string[];
    bodyPartsToMinimize: string[];
    occasionPreferences: string[];
  };
  knowledgeBase: string;
  colorimetryAnalysis?: string;
  figureAnalysis?: string;
  biometricData?: any;
  avatarDataUri?: string; // ID de IndexedDB o URL
  onboardingComplete: boolean;
  passcode: string;
  purchasedCapsules?: number;
  groomingCredits?: number;
  onboardingStep?: number;
  hasBeard?: boolean;
  detectedFeatures?: {
    skinTone: string;
    hairColor: string;
    eyeColor: string;
  };
}

export const DEFAULT_KNOWLEDGE_BASE = `REGLAS MAESTRAS DE ESTILO - PILAR CATALÁN:
1. PRIORIDAD ARMARIO: Siempre priorizar prendas que el usuario ya posee.
2. COLORIMETRÍA MODERNA: Clasificar en Cálida (dorados/tierra) o Fría (plateados/azules).
3. FIGURA: Estructurar silueta según morfología detectada.
4. TONO: Humano, sintetizado y profesional.`;

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  gender: 'Femenino',
  stylePreferences: {
    favoriteColors: [],
    preferredStyles: [],
    dislikedStyles: [],
    bodyPartsToAccentuate: [],
    bodyPartsToMinimize: [],
    occasionPreferences: [],
  },
  knowledgeBase: DEFAULT_KNOWLEDGE_BASE,
  onboardingComplete: false,
  passcode: '1,2,3,4',
  purchasedCapsules: 0,
  groomingCredits: 0,
  hasBeard: false,
};
