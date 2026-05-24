
"use client"

import { useState, useEffect } from 'react';

/**
 * Hook base para localStorage con manejo de errores de cuota.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error al leer localStorage:", error);
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
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Cuota de localStorage excedida. Limpiando datos no críticos...");
      }
      console.error("Error al guardar en localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}

/**
 * Hook especializado que añade el sufijo del usuario activo a la clave de búsqueda.
 * Maneja errores de cuota para evitar crash en dispositivos con poco espacio.
 */
export function useUserScopedStorage<T>(baseKey: string, initialValue: T) {
  const [activeUser] = useLocalStorage<string>('estiliza_active_user', 'default');
  const scopedKey = `${baseKey}_${activeUser.toLowerCase().replace(/\s+/g, '_')}`;
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(scopedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(scopedKey);
      if (item) setStoredValue(JSON.parse(item));
      else setStoredValue(initialValue);
    } catch (e) {
      setStoredValue(initialValue);
    }
  }, [scopedKey, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));
      }
    } catch (error: any) {
      console.error("Error en useUserScopedStorage (setValue):", error);
      if (error.name === 'QuotaExceededError') {
        alert("Tu dispositivo se ha quedado sin espacio para guardar más datos locales. Por favor, elimina algunos ítems del armario.");
      }
    }
  };

  return [storedValue, setValue] as const;
}

export interface WardrobeItem {
  id: string;
  name: string;
  type: string;
  imageDataUri: string;
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
  avatarDataUri?: string;
  onboardingComplete: boolean;
  passcode: string;
  purchasedCapsules?: number;
  groomingCredits?: number;
  onboardingStep?: number;
  hasBeard?: boolean;
  // Rasgos faciales específicos para mostrar sin cargar el objeto completo
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
