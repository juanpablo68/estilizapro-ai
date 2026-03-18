
'use server';
/**
 * @fileOverview Flujo para probar la validez de las API Keys de OpenAI y Gemini.
 */

import { getGenkit } from '@/ai/genkit';
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
      // Inicializamos una instancia fresca de Genkit con la llave proporcionada
      const dynamicAI = getGenkit(input.apiKey);
      
      const { text } = await dynamicAI.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: 'Hola, responde exactamente con la palabra "OK" si este mensaje te llega correctamente.',
      });

      if (text.toUpperCase().includes("OK") || text.length > 0) {
        return { success: true, message: "Conexión con Gemini (Cerebro Analítico) exitosa." };
      }
      throw new Error("Respuesta inesperada del modelo.");
    } catch (err: any) {
      console.error("Gemini Test Error:", err);
      return { success: false, message: `Error en Gemini: ${err.message || "Revisa si la llave es válida y tiene cuota disponible."}` };
    }
  }
}
