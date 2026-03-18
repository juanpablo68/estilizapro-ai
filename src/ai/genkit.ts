
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Maestra de Genkit para EstilizaPro AI.
 * Permite inicializar el motor de IA con llaves dinámicas para máxima flexibilidad.
 */
export const getGenkit = (apiKey?: string) => {
  return genkit({
    plugins: [
      googleAI({ apiKey: apiKey || process.env.GOOGLE_GENAI_API_KEY }),
    ],
  });
};

// Instancia por defecto para compatibilidad
export const ai = getGenkit();

// Definimos el ID del modelo como constante para evitar errores de tipado
export const GEMINI_MODEL = 'googleai/gemini-1.5-flash';
