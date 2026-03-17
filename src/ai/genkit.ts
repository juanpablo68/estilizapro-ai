import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuración central de Genkit para EstilizaPro AI.
 * Diseñada exclusivamente para utilizar OpenAI (GPT-4o y DALL-E 3).
 */
export const ai = genkit({
  plugins: [
    openAI(),
  ],
  model: 'openai/gpt-4o',
});
