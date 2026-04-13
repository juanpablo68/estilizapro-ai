'use server';
/**
 * @fileOverview Diagnóstico unificado para OpenAI y Unsplash (Pure OpenAI Architecture).
 */

import OpenAI from 'openai';
import { z } from 'genkit';
import { getOpenAIKey, getUnsplashKey } from '@/ai/genkit';

const TestAPIInputSchema = z.object({
  provider: z.enum(['openai', 'unsplash']),
  apiKey: z.string().optional(),
});

export async function testAPIConnection(input: z.infer<typeof TestAPIInputSchema>) {
  try {
    const finalKey = input.provider === 'openai' 
        ? getOpenAIKey(input.apiKey) 
        : getUnsplashKey(input.apiKey);

    if (!finalKey || finalKey.trim() === '') {
      throw new Error(`No se encontró una llave de ${input.provider} (ni manual ni global).`);
    }
    
    if (input.provider === 'openai') {
      const openai = new OpenAI({ apiKey: finalKey });
      const response = await openai.models.list();
      const hasGpt4 = response.data.some(m => m.id.includes('gpt-4o'));
      
      return { 
        success: true, 
        message: hasGpt4 
          ? "¡Conexión Exitosa! GPT-4o y DALL-E están activos mediante la configuración global." 
          : "Conexión exitosa, pero verifica el acceso a GPT-4o en tu plan."
      };
    } else {
      // Test Unsplash
      const response = await fetch(
        `https://api.unsplash.com/photos/random?client_id=${finalKey}`,
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
