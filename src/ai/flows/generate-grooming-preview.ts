'use server';
/**
 * @fileOverview Generación de Visagismo con descarga de imagen segura.
 */

import { ai, getOpenAIKey } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

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
  return generateGroomingPreviewFlow(input);
}

const generateGroomingPreviewFlow = ai.defineFlow(
  {
    name: 'generateGroomingPreviewFlow',
    inputSchema: GenerateGroomingPreviewInputSchema,
    outputSchema: GenerateGroomingPreviewOutputSchema,
  },
  async (input) => {
    const apiKey = getOpenAIKey(input.openaiApiKey);
    if (!apiKey) throw new Error("API Key de OpenAI requerida.");

    const openai = new OpenAI({ apiKey });
    const data = input.biometricData || {};
    const gender = data.genero || 'Femenino';
    
    // Resumimos visualmente para evitar prompts excesivamente largos
    const visualRef = input.description.length > 300 ? input.description.substring(0, 300) : input.description;

    const finalPrompt = `Close-up high-end portrait of ONE SINGLE ${gender}. 
    LOOK: ${visualRef}. 
    ${gender === 'Masculino' && input.hasBeard ? 'Include a perfectly groomed beard.' : ''}
    ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
    ART STYLE: Modern 3D stylized character, studio lighting. 
    ENVIRONMENT: Solid pure white background.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) throw new Error("No se pudo obtener la URL de la imagen.");

      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      return { previewImageDataUri: `data:${contentType};base64,${base64}` };
    } catch (error: any) {
      console.error("Grooming Image Error:", error);
      throw new Error("Error técnico al visualizar el look estético.");
    }
  }
);
