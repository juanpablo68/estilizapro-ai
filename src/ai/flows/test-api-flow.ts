'use server';
/**
 * @fileOverview Diagnóstico unificado para OpenAI y Unsplash (Pure OpenAI Architecture).
 */

import OpenAI from 'openai';
import { z } from 'genkit';

const TestAPIInputSchema = z.object({
  provider: z.enum(['openai', 'unsplash']),
  apiKey: z.string(),
});

export async function testAPIConnection(input: z.infer<typeof TestAPIInputSchema>) {
  try {
    if (!input.apiKey || input.apiKey.trim() === '') {
      throw new Error(`La llave de ${input.provider} está vacía.`);
    }
    
    if (input.provider === 'openai') {
      const openai = new OpenAI({ apiKey: input.apiKey });
      const response = await openai.models.list();
      const hasGpt4 = response.data.some(m => m.id.includes('gpt-4o'));
      
      return { 
        success: true, 
        message: hasGpt4 
          ? "¡Conexión Exitosa! GPT-4o y DALL-E están listos." 
          : "Conexión exitosa, pero no se detectó acceso a GPT-4o. Revisa tu plan."
      };
    } else {
      // Test Unsplash
      const response = await fetch(
        `https://api.unsplash.com/photos/random?client_id=${input.apiKey}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.errors?.[0] || "Error en la API de Unsplash");
      }
      
      return {
        success: true,
        message: "¡Conexión Exitosa! El motor visual de Unsplash está activo."
      };
    }
  } catch (err: any) {
    console.error(`Test ${input.provider} Error:`, err);
    return { 
      success: false, 
      message: `Error en ${input.provider}: ${err.message || "Credenciales inválidas o error de red"}` 
    };
  }
}
