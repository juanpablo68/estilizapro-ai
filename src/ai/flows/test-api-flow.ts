
'use server';
/**
 * @fileOverview Flujo para probar la validez de las API Keys de OpenAI y Gemini.
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
      // Una llamada ligera para probar la conexión
      await openai.models.list();
      return { success: true, message: "Conexión con OpenAI (DALL-E 3) exitosa." };
    } catch (err: any) {
      return { success: false, message: `Error en OpenAI: ${err.message}` };
    }
  } else {
    try {
      if (!input.apiKey.startsWith('AIza')) {
        throw new Error("El formato de la llave de Gemini parece incorrecto (debe empezar por AIza).");
      }

      // Inicializamos una instancia fresca y el modelo vinculado
      const { ai, model } = getGenkitEngine(input.apiKey);
      
      const { text } = await ai.generate({
        model: model,
        prompt: 'Responde solo con la palabra OK.',
      });

      if (text && text.length > 0) {
        return { success: true, message: "Conexión con Gemini (Cerebro Analítico) exitosa." };
      }
      throw new Error("No se recibió respuesta del modelo. Revisa la cuota de tu API Key.");
    } catch (err: any) {
      console.error("Gemini Test Error:", err);
      let errorMsg = err.message || "Error desconocido.";
      if (errorMsg.includes("API_KEY_INVALID")) errorMsg = "La API Key de Gemini no es válida.";
      if (errorMsg.includes("403")) errorMsg = "Acceso denegado (403). Revisa si el modelo Gemini 1.5 Flash está habilitado en tu proyecto.";
      
      return { success: false, message: `Error en Gemini: ${errorMsg}` };
    }
  }
}
