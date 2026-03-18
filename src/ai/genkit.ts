
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Se utiliza Gemini 2.5 Flash según la disponibilidad detectada en la consola del usuario.
 */
export function getGenkitEngine(apiKey?: string) {
  const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("No se proporcionó una API Key para Gemini. Configúrala en Ajustes.");
  }

  // Inicializamos el plugin con la llave específica
  const googleAIPlugin = googleAI({ apiKey: key });

  // Creamos una instancia de Genkit vinculada a ese plugin
  const ai = genkit({
    plugins: [googleAIPlugin],
  });

  return {
    ai,
    // Utilizamos el identificador de modelo detectado en la consola del usuario
    model: 'googleai/gemini-2.5-flash',
  };
}

// Instancia por defecto (requiere variable de entorno)
export const ai = genkit({
  plugins: [googleAI()],
});
