'use server';
/**
 * @fileOverview Generación de Visagismo usando Imagen 4.
 * Extrae solo los rasgos visuales para evitar errores de prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateGroomingPreviewInputSchema = z.object({
  description: z.string(),
  biometricData: z.any().optional(),
  hasBeard: z.boolean().optional(),
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
    const data = input.biometricData || {};
    const gender = data.genero || 'Femenino';
    
    // Simplificamos la descripción para que Imagen 4 la procese mejor
    const visualRef = input.description.length > 300 ? input.description.substring(0, 300) : input.description;

    const finalPrompt = `Close-up high-end portrait of ONE SINGLE ${gender}. 
    LOOK: ${visualRef}. 
    ${gender === 'Masculino' && input.hasBeard ? 'Include a perfectly groomed beard.' : ''}
    ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
    ART STYLE: Modern 3D stylized character, studio lighting. 
    ENVIRONMENT: Solid pure white background.`;

    try {
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: finalPrompt,
      });

      if (!media?.url) throw new Error("Error visual con Imagen 4.");

      return { previewImageDataUri: media.url };
    } catch (error: any) {
      console.error("Imagen 4 Grooming Error:", error);
      throw new Error("Error técnico al visualizar el look estético con el nuevo motor.");
    }
  }
);
