
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Se adapta a los modelos de última generación detectados en la consola del usuario.
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
    // Devolvemos el plugin para poder usar .model() de forma segura si es necesario
    plugin: googleAIPlugin,
    // Identificador base estable para modelos Flash. 
    // Se devuelve como 'model' para coincidir con la desestructuración en los flows.
    model: 'googleai/gemini-1.5-flash',
  };
}

// Instancia estática base para inicialización del sistema (usa env vars)
export const ai = genkit({
  plugins: [googleAI()],
});
