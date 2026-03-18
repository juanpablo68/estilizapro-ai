
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Fábrica Maestra de Genkit para EstilizaPro AI.
 * Resuelve el error de 'Unknown action type' proporcionando una instancia y modelo vinculados.
 */
export const getGenkitEngine = (apiKey?: string) => {
  const key = apiKey || process.env.GOOGLE_GENAI_API_KEY;
  const plugin = googleAI({ apiKey: key });
  
  const aiInstance = genkit({
    plugins: [plugin],
  });

  return {
    ai: aiInstance,
    // Usamos la referencia directa del plugin para evitar errores de registro
    model: plugin.model('gemini-1.5-flash'),
  };
};

// Instancia por defecto para compatibilidad inicial
export const { ai } = getGenkitEngine();
