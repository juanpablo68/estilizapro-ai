
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica de IA para EstilizaPro.
 * El sistema es Pure OpenAI, pero mantenemos Genkit para la compatibilidad de flujos.
 */
export const ai = genkit({
  plugins: [googleAI()],
});

/**
 * Recuperación inteligente de llaves de API.
 * Jerarquía: Input del flujo -> LocalStorage (manual usuario) -> Variable de Entorno (programación).
 */
export function getOpenAIKey(manualKey?: string) {
  // 1. Prioridad absoluta: Llave pasada directamente (desde el cliente)
  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') return manualKey;
  
  // 2. Intento de recuperación desde LocalStorage (solo si se ejecuta en cliente)
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('openai_api_key');
      if (local && local.trim() !== '' && local !== 'undefined') return local;
    } catch (e) {
      // Ignorar errores de acceso a storage
    }
  }
  
  // 3. Fallback final: Variable de entorno del servidor (Configuración Global)
  return process.env.OPENAI_API_KEY;
}

export function getUnsplashKey(manualKey?: string) {
  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') return manualKey;

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('unsplash_access_key');
      if (local && local.trim() !== '' && local !== 'undefined') return local;
    } catch (e) {
      // Ignorar errores
    }
  }

  return process.env.UNSPLASH_ACCESS_KEY;
}
