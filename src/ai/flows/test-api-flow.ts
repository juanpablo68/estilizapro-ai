
'use server';
/**
 * @fileOverview Flujo de diagnóstico profundo para validar API Keys.
 * Detecta errores específicos de cuota (429) y modelos no habilitados.
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
      // Probamos listando modelos para validar la llave
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
        throw new Error("Formato incorrecto: Las llaves de Gemini deben empezar por 'AIza'.");
      }

      // Obtenemos el motor configurado con la llave del usuario
      const { ai, model } = getGenkitEngine(input.apiKey);
      
      // Intentamos una generación mínima para validar el modelo y la cuota
      const response = await ai.generate({
        model: model,
        prompt: 'Responde solo con la palabra OK.',
        config: {
          maxOutputTokens: 5,
          temperature: 0.1,
        }
      });

      if (response && response.text) {
        return { success: true, message: `Conexión con Gemini exitosa (Modelo: ${model}).` };
      }
      
      throw new Error("La IA no devolvió una respuesta válida.");
    } catch (err: any) {
      console.error("Gemini Test Error:", err);
      let errorMsg = err.message || "Error desconocido.";
      
      // Mapeo de errores comunes para el usuario
      if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
        errorMsg = "Límite de frecuencia agotado (Error 429). Tu cuota gratuita de Google AI Studio ha llegado al límite. Debes esperar un momento o revisar tu facturación.";
      } else if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("invalid")) {
        errorMsg = "La API Key de Gemini no es válida o ha sido revocada.";
      } else if (errorMsg.includes("403") || errorMsg.includes("permission")) {
        errorMsg = "Acceso denegado (403). Asegúrate de tener habilitado el modelo Flash en tu consola de Google.";
      } else if (errorMsg.includes("Unknown action") || errorMsg.includes("not found")) {
        errorMsg = "Error de registro: El motor no reconoce el modelo. Reintenta o contacta a soporte.";
      }
      
      return { success: false, message: `Fallo en Gemini: ${errorMsg}` };
    }
  }
}
