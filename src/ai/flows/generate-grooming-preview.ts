
'use server';
/**
 * @fileOverview Generación de Visagismo usando el motor gpt-image-2 con b64_json.
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
  if (!apiKey) throw new Error("API Key de OpenAI requerida (401).");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';
  
  const cleanDescription = input.description.split('.')[0].substring(0, 200);

  const finalPrompt = `Close-up high-end portrait of ONE SINGLE ${gender}. 
  STYLE: Modern 3D stylized character.
  LOOK: ${cleanDescription}. 
  ${gender === 'Masculino' && input.hasBeard ? 'With a perfectly groomed beard.' : ''}
  ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
  ENVIRONMENT: Solid pure white background. NO TEXT.`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const b64Data = response.data[0].b64_json;
    if (!b64Data) {
      console.error("Respuesta Grooming sin b64_json:", JSON.stringify(response, null, 2));
      throw new Error("No se pudo obtener el Base64 del look.");
    }

    return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
  } catch (error: any) {
    console.error("Grooming Image Error (gpt-image-2):", error);
    if (error.status === 401) throw new Error("Error 401: API Key inválida.");
    if (error.status === 429) throw new Error("Error 429: Cuota excedida.");
    throw new Error(error.message || "Error al visualizar el look con gpt-image-2.");
  }
}
