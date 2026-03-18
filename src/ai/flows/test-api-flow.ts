
'use server';
/**
 * @fileOverview Flujo de diagnóstico profundo para validar API Keys.
 * Implementa pruebas secuenciales para modelos Gemini 2.0, 2.5 y 3 Flash.
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
    // Lista de modelos a probar secuencialmente según la consola del usuario
    const modelsToTry = [
      'googleai/gemini-2.0-flash',
      'googleai/gemini-2.0-flash-lite-preview-02-05',
      'googleai/gemini-1.5-flash'
    ];

    let lastError = "";

    for (const modelId of modelsToTry) {
      try {
        const { ai } = getGenkitEngine(input.apiKey);
        
        const response = await ai.generate({
          model: modelId,
          prompt: 'OK',
          config: { maxOutputTokens: 2 }
        });

        if (response && response.text) {
          return { 
            success: true, 
            message: `¡Éxito! Conectado a Gemini mediante el modelo: ${modelId}.` 
          };
        }
      } catch (err: any) {
        lastError = err.message || "Error desconocido";
        // Si es un error de cuota (429), lo reportamos de inmediato
        if (lastError.includes("429") || lastError.includes("quota")) {
          return { 
            success: false, 
            message: "Límite de frecuencia agotado (Error 429). Tu cuota gratuita de Google AI Studio ha llegado al límite. Debes esperar un momento." 
          };
        }
      }
    }

    // Mapeo de errores comunes para el usuario final
    let userFriendlyError = lastError;
    if (userFriendlyError.includes("API_KEY_INVALID")) {
      userFriendlyError = "La API Key de Gemini no es válida.";
    } else if (userFriendlyError.includes("Unknown action")) {
      userFriendlyError = "Error de registro: El motor no reconoce los modelos Flash 2.0/3 en tu región todavía.";
    }

    return { success: false, message: `Fallo en Gemini: ${userFriendlyError}` };
  }
}
