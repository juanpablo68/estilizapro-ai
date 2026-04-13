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
  if (manualKey && manualKey.trim() !== '') return manualKey;
  
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('openai_api_key');
    if (local && local.trim() !== '') return local;
  }
  
  return process.env.OPENAI_API_KEY;
}

export function getUnsplashKey(manualKey?: string) {
  if (manualKey && manualKey.trim() !== '') return manualKey;

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('unsplash_access_key');
    if (local && local.trim() !== '') return local;
  }

  return process.env.UNSPLASH_ACCESS_KEY;
}
