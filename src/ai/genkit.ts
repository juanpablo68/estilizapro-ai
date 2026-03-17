
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openAI} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
