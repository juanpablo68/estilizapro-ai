
'use server';
/**
 * @fileOverview Flujo de diagnóstico profundo para validar API Keys.
 * Configurado para probar específicamente Gemini 2.5 Flash.
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
    try {
      if (!input.apiKey || input.apiKey.trim() === '') {
        throw new Error("La llave de Gemini está vacía.");
      }
      
      if (!input.apiKey.startsWith('AIza')) {
        throw new Error("El formato de la llave de Gemini es incorrecto (debe empezar por AIza).");
      }

      const { ai, model } = getGenkitEngine(input.apiKey);
      
      const response = await ai.generate({
        model: model,
        prompt: 'Responde solo con la palabra OK.',
        config: {
          maxOutputTokens: 5,
          temperature: 0.1,
        }
      });

      if (response && response.text) {
        return { success: true, message: "Conexión con Gemini 2.5 Flash exitosa." };
      }
      
      throw new Error("La IA no devolvió una respuesta válida.");
    } catch (err: any) {
      console.error("Gemini Test Error:", err);
      let errorMsg = err.message || "Error desconocido.";
      
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        errorMsg = "Límite de frecuencia agotado (Error 429). Según tu consola, has usado 3 de 5 solicitudes de Gemini 2.5 Flash. Debes esperar o activar la facturación.";
      } else if (errorMsg.includes("API_KEY_INVALID")) {
        errorMsg = "La API Key de Gemini no es válida.";
      } else if (errorMsg.includes("403")) {
        errorMsg = "Acceso denegado (403). Asegúrate de que el modelo Gemini 2.5 Flash esté habilitado en tu consola de Google AI Studio.";
      } else if (errorMsg.includes("not found") || errorMsg.includes("Unknown action")) {
        errorMsg = "El modelo Gemini 2.5 Flash no fue reconocido. Verifica que este modelo esté disponible para tu API Key.";
      }
      
      return { success: false, message: `Error en Gemini: ${errorMsg}` };
    }
  }
}
