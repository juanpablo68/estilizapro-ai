'use server';
/**
 * @fileOverview Generación visual de Visagismo optimizada.
 * Filtra el texto conversacional para evitar errores de prompt en DALL-E 3.
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
    const skin = data.colorimetria?.tono_piel || 'natural';
    const hair = data.rostro?.cabello?.color_natural || 'natural';

    // Extraemos solo los primeros 200 caracteres para el prompt visual para evitar errores
    const visualContext = input.description.substring(0, 300);

    const finalPrompt = `A high-end beauty portrait close-up of ONE SINGLE ${gender}. 
    GROOMING & STYLE: ${visualContext}. 
    FEATURES: ${skin} skin, ${hair} hair. 
    ${gender === 'Masculino' ? (input.hasBeard ? 'With a well-groomed beard.' : 'Clean shaven face.') : ''}
    STYLE: Modern 3D stylized character design, cinematic studio lighting. 
    ENVIRONMENT: Solid pure white background.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      });

      const imageData = response.data[0].b64_json;
      if (!imageData) throw new Error("Sin datos de imagen.");

      return { previewImageDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Grooming Error:", error);
      throw new Error("Error visual en el estudio. Intenta con una descripción más corta.");
    }
  }
);
