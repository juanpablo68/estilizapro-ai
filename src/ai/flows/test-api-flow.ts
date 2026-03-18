'use server';
/**
 * @fileOverview Flujo para probar la validez de las API Keys de OpenAI y Gemini.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const TestAPIInputSchema = z.object({
  provider: z.enum(['openai', 'gemini']),
  apiKey: z.string(),
});

const TestAPIOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
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
      // Para Gemini en modo servidor sin .env persistente, intentamos una generación mínima
      // Nota: process.env se usa internamente por el plugin de googleAI
      process.env.GOOGLE_GENAI_API_KEY = input.apiKey;
      
      const { text } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: 'Hola, responde con la palabra "OK" si me escuchas.',
      });

      if (text.includes("OK") || text.length > 0) {
        return { success: true, message: "Conexión con Gemini (Cerebro Analítico) exitosa." };
      }
      throw new Error("Respuesta inesperada del modelo.");
    } catch (err: any) {
      return { success: false, message: `Error en Gemini: ${err.message}` };
    }
  }
}
