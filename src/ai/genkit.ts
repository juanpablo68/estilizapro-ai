import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuración central de Genkit para EstilizaPro AI.
 */
export const ai = genkit({
  plugins: [
    openAI(),
  ],
  model: 'openai/gpt-4o',
});
