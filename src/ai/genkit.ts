import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuración central de Genkit para EstilizaPro AI.
 * Unificada exclusivamente en OpenAI para máxima estabilidad y evitar conflictos de plugins.
 */
export const ai = genkit({
  plugins: [
    openAI(),
  ],
  model: 'openai/gpt-4o',
});
