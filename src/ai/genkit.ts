
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 */
export function getGenkitEngine(apiKey?: string) {
  const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("No se proporcionó una API Key para Gemini. Configúrala en Ajustes.");
  }

  // Inicializamos el plugin con la llave dinámica
  const googleAIPlugin = googleAI({ apiKey: key });

  // Creamos la instancia de Genkit vinculada a ese plugin
  const ai = genkit({
    plugins: [googleAIPlugin],
  });

  return {
    ai,
    // Identificador oficial para el modelo Flash en Genkit 1.x
    model: 'googleai/gemini-1.5-flash',
  };
}

// Instancia estática base para inicialización del sistema
export const ai = genkit({
  plugins: [googleAI()],
});
