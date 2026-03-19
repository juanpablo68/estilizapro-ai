import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica de IA para EstilizaPro.
 * Aunque el sistema ahora es Pure OpenAI, mantenemos la instancia base de Genkit
 * para la compatibilidad con los flujos definidos.
 */
export const ai = genkit({
  plugins: [googleAI()],
});

/**
 * Obtiene la llave de OpenAI configurada localmente o en el entorno.
 */
export function getOpenAIKey() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('openai_api_key') || process.env.OPENAI_API_KEY;
  }
  return process.env.OPENAI_API_KEY;
}
