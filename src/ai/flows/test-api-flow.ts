'use server';
/**
 * @fileOverview Diagnóstico unificado para OpenAI (Pure OpenAI Architecture).
 */

import OpenAI from 'openai';
import { z } from 'genkit';

const TestAPIInputSchema = z.object({
  provider: z.literal('openai'),
  apiKey: z.string(),
});

export async function testAPIConnection(input: z.infer<typeof TestAPIInputSchema>) {
  try {
    if (!input.apiKey || input.apiKey.trim() === '') {
      throw new Error("La llave de OpenAI está vacía.");
    }
    const openai = new OpenAI({ apiKey: input.apiKey });
    // Probamos el listado de modelos para validar la llave
    await openai.models.list();
    return { 
      success: true, 
      message: "¡Conexión Exitosa! El cerebro GPT-4o y el artista DALL-E están listos." 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `Error en OpenAI: ${err.message}` 
    };
  }
}
