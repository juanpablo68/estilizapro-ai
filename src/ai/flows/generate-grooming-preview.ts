'use server';
/**
 * @fileOverview Generación de Look Estético.
 * Retorna Base64 para guardado local en IndexedDB.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

const GenerateGroomingPreviewInputSchema = z.object({
  description: z.string(),
  biometricData: z.any().optional(),
  hasBeard: z.boolean().optional(),
  openaiApiKey: z.string().optional(),
});

export async function generateGroomingPreview(input: z.infer<typeof GenerateGroomingPreviewInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Error 401: No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });
  const gender = input.biometricData?.genero || 'Femenino';
  const cleanDescription = input.description.split('.')[0].substring(0, 300);

  const finalPrompt = `A high-end professional beauty portrait of ONE SINGLE ${gender}. 
  LOOK: ${cleanDescription}. 
  ${gender === 'Masculino' && input.hasBeard ? 'With a perfectly detailed groomed beard.' : ''}
  STYLE: Modern 3D stylized character design, extreme close-up face portrait, solid pure white background. NO text.`;

  try {
    console.log("Calling gpt-image-2 for grooming without response_format");
    
    // IMPORTANTE:
    // No agregar response_format con gpt-image-2.
    // Causaba error 400. Se lee b64_json por defecto.
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium" as any,
    });

    const b64Data = response.data?.[0]?.b64_json;
    if (!b64Data) {
      console.error("Respuesta completa OpenAI Grooming:", JSON.stringify(response, null, 2));
      throw new Error("La IA no devolvió datos de imagen válidos.");
    }

    return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
  } catch (error: any) {
    console.error("Grooming Generation Error:", error);
    throw new Error(error.message || "Error al generar la vista previa del look.");
  }
}
