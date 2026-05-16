'use server';
/**
 * @fileOverview Generación visual de Visagismo.
 * Versión estable sin parámetros conflictivos.
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
    const personType = data.genero || 'Femenino';
    const skinTone = data.colorimetria?.tono_piel || 'natural skin';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural hair';

    // Extraemos las primeras oraciones para evitar prompts demasiado largos
    const visualSummary = input.description.split('.').slice(0, 2).join('.') + ".";

    const finalPrompt = `A high-end professional beauty editorial close-up portrait of ONE ${personType}. 
    GROOMING & STYLE: ${visualSummary}. 
    PHYSICAL: Skin tone ${skinTone}, Hair ${hairColor}. 
    ${personType === 'Masculino' ? (input.hasBeard ? 'With a well-groomed beard.' : 'Clean shaven.') : ''}
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
      if (!imageData) throw new Error("La IA no devolvió datos de imagen.");

      return { previewImageDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Grooming Error:", error);
      throw new Error(error.message || "Error al generar la visualización estética.");
    }
  }
);
