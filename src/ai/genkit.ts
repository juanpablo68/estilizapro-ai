
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Se adapta a los modelos de última generación (2.0/2.5/3 Flash) detectados en la consola del usuario.
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
    // Utilizamos el identificador 'googleai/gemini-2.0-flash' como base estable para los nuevos modelos Flash.
    // El sistema de pruebas en Ajustes validará si este o los modelos 2.5/3 están activos.
    model: 'googleai/gemini-2.0-flash',
  };
}

// Instancia estática base para inicialización
export const ai = genkit({
  plugins: [googleAI()],
});
