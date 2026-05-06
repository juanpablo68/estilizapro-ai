
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica de IA para EstilizaPro.
 */
export const ai = genkit({
  plugins: [googleAI()],
});

/**
 * Recuperación inteligente de llaves de API.
 * Prioriza la llave del servidor (.env) para que la app funcione automáticamente para todos.
 */
export function getOpenAIKey(manualKey?: string) {
  // 1. Intentar obtener la llave del entorno del servidor (Configuración Global)
  // Esta es la que permite que otros usuarios usen la app sin configurar nada
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey && envKey.trim() !== '' && !envKey.includes('tu-llave-aqui')) {
    return envKey;
  }
  
  // 2. Si no hay llave global, intentar con la manual (LocalStorage del usuario)
  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') {
    return manualKey;
  }
  
  // 3. Intento de recuperación desde el almacenamiento local del navegador
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('openai_api_key');
      if (local && local.trim() !== '' && local !== 'undefined') return local;
    } catch (e) {
      // Ignorar errores de acceso
    }
  }
  
  return undefined;
}

export function getUnsplashKey(manualKey?: string) {
  const envKey = process.env.UNSPLASH_ACCESS_KEY;
  if (envKey && envKey.trim() !== '' && !envKey.includes('tu-llave-aqui')) {
    return envKey;
  }

  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') {
    return manualKey;
  }

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('unsplash_access_key');
      if (local && local.trim() !== '' && local !== 'undefined') return local;
    } catch (e) {
      // Ignorar
    }
  }

  return undefined;
}
