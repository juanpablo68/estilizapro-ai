
'use server';
/**
 * @fileOverview Generación de Visagismo usando DALL-E 3.
 * Procesa la descripción para que sea un prompt visual apto.
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

const GenerateGroomingPreviewOutputSchema = z.object({
  previewImageDataUri: z.string(),
});

export async function generateGroomingPreview(input: z.infer<typeof GenerateGroomingPreviewInputSchema>): Promise<z.infer<typeof GenerateGroomingPreviewOutputSchema>> {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';
  
  // Limpiamos la descripción para que sea puramente visual
  const visualRef = input.description.length > 400 ? input.description.substring(0, 400) : input.description;

  const finalPrompt = `Close-up high-end portrait of ONE SINGLE ${gender}. 
  STYLE: Modern 3D stylized character.
  LOOK: ${visualRef}. 
  ${gender === 'Masculino' && input.hasBeard ? 'Include a perfectly groomed beard.' : ''}
  ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
  ENVIRONMENT: Solid pure white background.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) throw new Error("No se recibió la imagen del look.");

    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    return { previewImageDataUri: base64 };
  } catch (error: any) {
    console.error("DALL-E Grooming Error:", error);
    throw new Error("Error al visualizar el look estético.");
  }
}
