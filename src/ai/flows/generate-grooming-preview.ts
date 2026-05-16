'use server';
/**
 * @fileOverview Generación de Visagismo con prompt filtrado para evitar errores.
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
    
    // Simplificamos la descripción para que sea un prompt visual puro
    const visualPrompt = input.description.length > 200 ? input.description.substring(0, 200) : input.description;

    const finalPrompt = `Professional close-up portrait of ONE SINGLE ${gender}. 
    GROOMING STYLE: ${visualPrompt}. 
    ${gender === 'Masculino' && input.hasBeard ? 'With a well-groomed beard.' : ''}
    ${gender === 'Masculino' && !input.hasBeard ? 'Clean shaven face.' : ''}
    ART STYLE: Modern 3D stylized character, cinematic lighting. 
    ENVIRONMENT: Solid white background.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });

      const imageData = response.data[0].b64_json;
      if (!imageData) throw new Error("Error en datos de imagen.");

      return { previewImageDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("Grooming Image Error:", error);
      throw new Error("No se pudo generar la vista previa visual.");
    }
  }
);
