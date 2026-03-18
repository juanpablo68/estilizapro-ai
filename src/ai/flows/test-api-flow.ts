
'use server';
/**
 * @fileOverview Flujo de diagnóstico inteligente para validar API Keys.
 * Prueba secuencialmente modelos de nueva generación para encontrar el activo.
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
    // Lista de identificadores técnicos oficiales para modelos Flash (incluyendo versiones 2.0+)
    const modelsToTry = [
      'googleai/gemini-2.0-flash',
      'googleai/gemini-1.5-flash',
      'googleai/gemini-2.0-flash-lite-preview-02-05'
    ];

    let lastError = "";

    for (const modelId of modelsToTry) {
      try {
        const { ai } = getGenkitEngine(input.apiKey, modelId);
        
        const response = await ai.generate({
          model: modelId,
          prompt: 'ping',
          config: { maxOutputTokens: 5 }
        });

        if (response && response.text) {
          const versionLabel = modelId.includes('2.0') ? '2.0 / 2.5' : '1.5';
          return { 
            success: true, 
            message: `¡Éxito! Conectado a Gemini utilizando el motor Flash ${versionLabel}.` 
          };
        }
      } catch (err: any) {
        lastError = err.message || "Error desconocido";
        // Si el error es de cuota, la llave es válida pero el límite se ha alcanzado
        if (lastError.includes("429") || lastError.toLowerCase().includes("quota")) {
          return { 
            success: false, 
            message: "Límite de cuota alcanzado (Error 429). Tu llave es válida pero Google ha pausado el acceso gratuito por hoy." 
          };
        }
        // Si el modelo no existe, simplemente probamos el siguiente de la lista
        continue;
      }
    }

    return { 
      success: false, 
      message: `Fallo en Gemini: ${lastError}. Asegúrate de que el modelo Flash esté habilitado en tu proyecto de Google AI Studio.` 
    };
  }
}
