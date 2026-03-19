
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
    
    // Probamos una llamada ligera para validar la llave
    const response = await openai.models.list();
    
    // Verificamos si tiene acceso a los modelos necesarios
    const hasGpt4 = response.data.some(m => m.id.includes('gpt-4o'));
    
    return { 
      success: true, 
      message: hasGpt4 
        ? "¡Conexión Exitosa! GPT-4o y DALL-E están listos." 
        : "Conexión exitosa, pero no se detectó acceso a GPT-4o. Revisa tu plan."
    };
  } catch (err: any) {
    console.error('Test API Error:', err);
    return { 
      success: false, 
      message: `Error en OpenAI: ${err.message || "Credenciales inválidas o error de red"}` 
    };
  }
}
