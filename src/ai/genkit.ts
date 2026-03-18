
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuración Maestra de Genkit para EstilizaPro AI.
 * Arquitectura Híbrida:
 * - Google AI (Gemini 1.5 Flash): El cerebro analítico (visión y lógica).
 * - OpenAI (DALL-E 3 vía SDK): El artista creativo (generación de avatar).
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
