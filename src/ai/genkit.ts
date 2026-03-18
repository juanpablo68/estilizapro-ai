
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Se actualiza a Gemini 2.0 Flash para máxima compatibilidad con las nuevas cuotas de Google AI Studio.
 */
export function getGenkitEngine(apiKey?: string) {
  // Buscamos la llave en el parámetro, o en las variables de entorno como fallback
  const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("No se proporcionó una API Key para Gemini.");
  }

  // Inicializamos el plugin con la llave específica
  const googleAIPlugin = googleAI({ apiKey: key });

  // Creamos una instancia de Genkit vinculada a ese plugin
  const ai = genkit({
    plugins: [googleAIPlugin],
  });

  return {
    ai,
    // Actualizado a gemini-2.0-flash para coincidir con lo disponible en tu consola
    model: 'googleai/gemini-2.0-flash',
  };
}

// Instancia por defecto para inicialización estática
export const ai = genkit({
  plugins: [googleAI()],
});
