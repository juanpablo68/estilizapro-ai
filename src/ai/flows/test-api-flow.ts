
'use server';
/**
 * @fileOverview Flujo de diagnóstico profundo para validar API Keys.
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
      const openai = new OpenAI({ apiKey: input.apiKey });
      await openai.models.list();
      return { success: true, message: "Conexión con OpenAI (DALL-E 3) exitosa." };
    } catch (err: any) {
      return { success: false, message: `Error en OpenAI: ${err.message}` };
    }
  } else {
    try {
      if (!input.apiKey || input.apiKey.trim() === '') {
        throw new Error("La llave está vacía.");
      }
      
      if (!input.apiKey.startsWith('AIza')) {
        throw new Error("El formato de la llave de Gemini es incorrecto (debe empezar por AIza).");
      }

      // Usamos la fábrica dinámica para obtener un motor configurado con ESTA llave
      const { ai, model } = getGenkitEngine(input.apiKey);
      
      // Realizamos una llamada mínima de generación para probar la validez real de la llave
      const response = await ai.generate({
        model: model,
        prompt: 'Responde solo con la palabra OK.',
        config: {
          maxOutputTokens: 5,
          temperature: 0.1,
        }
      });

      if (response && response.text) {
        return { success: true, message: "Conexión con Gemini 2.0 (Cerebro Analítico) exitosa." };
      }
      
      throw new Error("La IA no devolvió una respuesta válida.");
    } catch (err: any) {
      console.error("Gemini Test Error:", err);
      let errorMsg = err.message || "Error desconocido.";
      
      // Mapeo de errores comunes de Google AI para el usuario
      if (errorMsg.includes("API_KEY_INVALID")) {
        errorMsg = "La API Key de Gemini no es válida.";
      } else if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
        errorMsg = "Has alcanzado el límite de frecuencia de tu API de Gemini (Error 429). Tal como indica tu consola, debes esperar o activar la facturación en Google Cloud para continuar.";
      } else if (errorMsg.includes("403")) {
        errorMsg = "Acceso denegado (403). Asegúrate de que el modelo Gemini 2.0 Flash esté habilitado en tu consola de Google AI Studio.";
      }
      
      return { success: false, message: `Error en Gemini: ${errorMsg}` };
    }
  }
}
