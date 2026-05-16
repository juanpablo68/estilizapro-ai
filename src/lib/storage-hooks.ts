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
}

export const DEFAULT_KNOWLEDGE_BASE = `REGLAS MAESTRAS DE ESTILO - PILAR CATALÁN:
1. PRIORIDAD ARMARIO: Siempre priorizar prendas que el usuario ya posee.
2. COLORIMETRÍA MODERNA: Clasificar en Cálida (dorados/tierra) o Fría (plateados/azules). No usar estaciones obsoletas.
3. FIGURA: Estructurar silueta según morfología detectada.
4. TONO: Humano, sintetizado y profesional. Evitar frases robóticas.`;

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