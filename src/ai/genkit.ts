import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

/**
 * Configuración central de Genkit para EstilizaPro AI.
 * Se utilizan plugins de Google y OpenAI para el procesamiento multimodal.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
