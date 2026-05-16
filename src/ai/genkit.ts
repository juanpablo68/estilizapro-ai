
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica de IA para EstilizaPro usando Google AI (Imagen 4).
 */
export const ai = genkit({
  plugins: [googleAI()],
});

/**
 * Recuperación inteligente de llaves de API.
 */
export function getOpenAIKey(manualKey?: string) {
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey && envKey.trim() !== '' && !envKey.includes('tu-llave-aqui')) return envKey;
  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') return manualKey;
  return undefined;
}

export function getGoogleAIKey(manualKey?: string) {
  const envKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '' && !envKey.includes('tu-llave-aqui')) return envKey;
  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') return manualKey;
  return undefined;
}

export function getUnsplashKey(manualKey?: string) {
  const envKey = process.env.UNSPLASH_ACCESS_KEY;
  if (envKey && envKey.trim() !== '' && !envKey.includes('tu-llave-aqui')) return envKey;
  if (manualKey && manualKey.trim() !== '' && manualKey !== 'undefined') return manualKey;
  return undefined;
}
