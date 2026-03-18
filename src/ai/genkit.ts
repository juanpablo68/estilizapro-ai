
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Se utiliza Gemini 1.5 Flash para asegurar compatibilidad con la cuota disponible del usuario.
 */
export function getGenkitEngine(apiKey?: string) {
  // Buscamos la llave en el parámetro, o en las variables de entorno como fallback
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
    // Usamos el identificador estándar que el plugin registra internamente
    model: 'googleai/gemini-1.5-flash',
  };
}

// Instancia por defecto (requiere variable de entorno)
export const ai = genkit({
  plugins: [googleAI()],
});
