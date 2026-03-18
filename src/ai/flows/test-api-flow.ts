
'use server';
/**
 * @fileOverview Flujo de diagnóstico profundo para validar API Keys.
 * Prueba secuencialmente modelos de nueva generación para encontrar el activo en la cuenta del usuario.
 */

import { getGenkitEngine } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const TestAPIInputSchema = z.object({
  provider: z.enum(['openai', 'gemini']),
  apiKey: z.string(),
});

export async function testAPIConnection(input: z.infer<typeof TestAPIInputSchema>) {
  if (input.provider === 'openai') {
    try {
      if (!input.apiKey || input.apiKey.trim() === '') {
        throw new Error("La llave de OpenAI está vacía.");
      }
      const openai = new OpenAI({ apiKey: input.apiKey });
      await openai.models.list();
      return { success: true, message: "Conexión con OpenAI (DALL-E 3) exitosa." };
    } catch (err: any) {
      return { success: false, message: `Error en OpenAI: ${err.message}` };
    }
  } else {
    // Lista de identificadores de modelos a probar secuencialmente
    // Intentamos 2.0 Flash primero (más común ahora), luego 1.5
    const modelsToTry = [
      'googleai/gemini-2.0-flash',
      'googleai/gemini-1.5-flash',
      'googleai/gemini-2.0-flash-lite-preview-02-05'
    ];

    let lastError = "";

    for (const modelId of modelsToTry) {
      try {
        const { ai } = getGenkitEngine(input.apiKey);
        
        const response = await ai.generate({
          model: modelId,
          prompt: 'Reliza una prueba de conexión rápida. Responde solo con la palabra OK.',
          config: { maxOutputTokens: 5 }
        });

        if (response && response.text) {
          return { 
            success: true, 
            message: `¡Éxito! Conectado a Gemini utilizando el motor: ${modelId.split('/')[1]}.` 
          };
        }
      } catch (err: any) {
        lastError = err.message || "Error desconocido";
        // Si es un error de cuota (429), lo reportamos específicamente
        if (lastError.includes("429") || lastError.includes("quota") || lastError.includes("limit")) {
          return { 
            success: false, 
            message: "Límite de frecuencia agotado (Error 429). Has alcanzado el límite de tu cuota gratuita de Google AI Studio por ahora." 
          };
        }
      }
    }

    // Mapeo de errores amigables si ninguna prueba funciona
    let userFriendlyError = lastError;
    if (userFriendlyError.includes("API_KEY_INVALID")) {
      userFriendlyError = "La API Key de Gemini no es válida.";
    } else if (userFriendlyError.includes("Unknown action")) {
      userFriendlyError = "El motor de IA no reconoce este modelo en tu región actual.";
    }

    return { success: false, message: `Fallo en Gemini: ${userFriendlyError}` };
  }
}
