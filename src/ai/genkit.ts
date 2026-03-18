
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuración de Genkit para EstilizaPro AI.
 * - Google AI: Cerebro para análisis lógico, colorimetría, figura corporal y Chat Experto.
 * - OpenAI (DALL-E 3): Gestionado vía SDK oficial para máxima estabilidad visual.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
