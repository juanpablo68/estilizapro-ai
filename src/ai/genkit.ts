
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Dinámica de Genkit para EstilizaPro AI.
 * Crea una instancia de motor de IA configurada en tiempo real con la llave proporcionada.
 * Utilizamos identificadores de modelo estándar para garantizar compatibilidad con las cuotas de Google AI Studio.
 */
export function getGenkitEngine(apiKey?: string) {
  const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("No se proporcionó una API Key para Gemini. Configúrala en Ajustes.");
  }

  // Inicializamos el plugin de Google AI con la llave específica
  const plugin = googleAI({ apiKey: key });

  // Creamos una instancia de Genkit vinculada a ese plugin
  const ai = genkit({
    plugins: [plugin],
  });

  return {
    ai,
    // 'gemini-1.5-flash' es el identificador estándar para el modelo Flash en el SDK.
    // Es el modelo que aparece con cuota activa (3/5) en la mayoría de consolas gratuitas.
    model: 'googleai/gemini-1.5-flash',
  };
}

// Instancia por defecto para inicialización estática
export const ai = genkit({
  plugins: [googleAI()],
});
