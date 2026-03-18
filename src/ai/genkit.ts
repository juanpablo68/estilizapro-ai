
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

  // Inicializamos el motor con el plugin de Google AI usando la llave dinámica
  const ai = genkit({
    plugins: [googleAI({ apiKey: key })],
  });

  return {
    ai,
    // Identificador base estable para modelos Flash. 
    // En Genkit 1.x con googleai plugin, el prefijo es 'googleai/'
    model: 'googleai/gemini-1.5-flash',
  };
}

// Instancia estática base para inicialización del sistema
export const ai = genkit({
  plugins: [googleAI()],
});
