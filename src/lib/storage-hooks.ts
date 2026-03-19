
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
  knowledgeBase: string; // Nueva Área de Conocimiento
  colorimetryAnalysis?: string;
  figureAnalysis?: string;
  avatarDataUri?: string;
  onboardingComplete: boolean;
  passcode: string;
  purchasedCapsulesCount: number;
}

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
  knowledgeBase: '',
  onboardingComplete: false,
  passcode: '1,2,3,4',
  purchasedCapsulesCount: 1,
};
