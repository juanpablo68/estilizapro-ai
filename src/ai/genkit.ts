
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuración Maestra de Genkit para EstilizaPro AI.
 * Arquitectura Híbrida:
 * - Google AI (Gemini 1.5 Flash): El cerebro analítico (visión y lógica).
 * - OpenAI (SDK Directo): El artista creativo para imágenes Pixar.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
