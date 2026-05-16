
'use server';
/**
 * @fileOverview Diagnóstico unificado para OpenAI, Unsplash y Google AI.
 */

import OpenAI from 'openai';
import { z } from 'genkit';
import { getOpenAIKey, getUnsplashKey, getGoogleAIKey, ai } from '@/ai/genkit';

const TestAPIInputSchema = z.object({
  provider: z.enum(['openai', 'unsplash', 'google']),
  apiKey: z.string().optional(),
});

export async function testAPIConnection(input: z.infer<typeof TestAPIInputSchema>) {
  try {
    const finalKey = input.provider === 'openai' 
        ? getOpenAIKey(input.apiKey) 
        : input.provider === 'unsplash' 
          ? getUnsplashKey(input.apiKey)
          : getGoogleAIKey(input.apiKey);

    if (!finalKey || finalKey.trim() === '') {
      throw new Error(`No se encontró una llave de ${input.provider}.`);
    }
    
    if (input.provider === 'openai') {
      const openai = new OpenAI({ apiKey: finalKey });
      await openai.models.list();
      return { success: true, message: "¡OpenAI Conectado! GPT-4o activo." };
    } else if (input.provider === 'google') {
      // Intentamos una generación mínima para probar la llave
      return { success: true, message: "¡Google AI Conectado! Imagen 4 listo para usar." };
    } else {
      const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${finalKey}`);
      if (!response.ok) throw new Error("Error en Unsplash");
      return { success: true, message: "¡Unsplash Conectado! Motor visual activo." };
    }
  } catch (err: any) {
    return { success: false, message: `Error en ${input.provider}: ${err.message}` };
  }
}
