
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Soporta modelos de nueva generación (2.0+) de forma adaptativa.
 */
export function getGenkitEngine(apiKey?: string, preferredModel?: string) {
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

  // El identificador oficial más estable para el motor Flash actual
  const modelToUse = preferredModel || 'googleai/gemini-2.0-flash';

  return {
    ai,
    model: modelToUse,
  };
}

// Instancia estática base para inicialización del sistema (usada por Genkit CLI)
export const ai = genkit({
  plugins: [googleAI()],
});
