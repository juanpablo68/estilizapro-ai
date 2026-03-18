
'use server';
/**
 * @fileOverview Flujo de diagnóstico para validar API Keys.
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
      await openai.models.list();
      return { success: true, message: "Conexión con OpenAI (DALL-E 3) exitosa." };
    } catch (err: any) {
      return { success: false, message: `Error en OpenAI: ${err.message}` };
    }
  } else {
    // Intentamos probar el modelo Flash estándar que suele tener cuota gratuita activa
    const modelsToTry = [
      'googleai/gemini-1.5-flash',
      'googleai/gemini-2.0-flash'
    ];

    let lastError = "";

    for (const modelId of modelsToTry) {
      try {
        const { ai } = getGenkitEngine(input.apiKey);
        
        const response = await ai.generate({
          model: modelId,
          prompt: 'OK',
          config: { maxOutputTokens: 5 }
        });

        if (response && response.text) {
          return { 
            success: true, 
            message: `¡Éxito! Conectado a Gemini utilizando el modelo: ${modelId.split('/')[1]}.` 
          };
        }
      } catch (err: any) {
        lastError = err.message || "Error desconocido";
        if (lastError.includes("429") || lastError.includes("quota")) {
          return { 
            success: false, 
            message: "Límite de cuota alcanzado (Error 429). Tu llave es válida pero Google ha pausado el acceso gratuito por hoy." 
          };
        }
      }
    }

    return { success: false, message: `Fallo en Gemini: ${lastError}` };
  }
}
