"use client"

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
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
  biometricData?: any; // Memoria HD para la IA
  avatarDataUri?: string;
  onboardingComplete: boolean;
  passcode: string;
  purchasedCapsules?: number;
}

/**
 * Base de Conocimiento Maestra de Pilar Cifuentes Catalán.
 * Estas reglas son las que la IA seguirá por defecto si el usuario no las edita.
 */
export const DEFAULT_KNOWLEDGE_BASE = `REGLAS MAESTRAS DE ESTILO - PILAR CIFUENTES CATALÁN:
1. PRIORIDAD ARMARIO: Siempre priorizar prendas que el usuario ya posee.
2. COLORIMETRÍA: Respetar estrictamente la estación sugerida (Otoño, Primavera, etc.). No sugerir colores que apaguen el rostro.
3. FIGURA: Para figuras tipo Óvalo o Pera, buscar estructurar hombros. Para Triángulo Invertido, dar volumen a caderas.
4. ESTÉTICA: Mantener un look lujoso, limpio y profesional. Evitar combinaciones estridentes a menos que el estilo sea 'Streetwear'.
5. CALZADO: El calzado debe ser coherente con la ocasión (no sugerir tacones para GIMNASIO).`;

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
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
};
