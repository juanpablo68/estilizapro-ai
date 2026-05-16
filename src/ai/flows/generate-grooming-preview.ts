
'use server';
/**
 * @fileOverview Generación de Visagismo usando Imagen 4 (Motor Genkit ultra-estable).
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const GenerateGroomingPreviewInputSchema = z.object({
  description: z.string(),
  biometricData: z.any().optional(),
  hasBeard: z.boolean().optional(),
});

export async function generateGroomingPreview(input: z.infer<typeof GenerateGroomingPreviewInputSchema>) {
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';
  
  // Limpiamos la descripción para que sea un prompt visual conciso
  const visualRef = input.description.length > 300 ? input.description.substring(0, 300) : input.description;

  const finalPrompt = `Close-up high-end portrait of ONE SINGLE ${gender}. 
  STYLE: Modern 3D stylized character.
  LOOK: ${visualRef}. 
  ${gender === 'Masculino' && input.hasBeard ? 'Include a perfectly groomed beard.' : ''}
  ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
  ENVIRONMENT: Solid pure white background.`;

  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: finalPrompt,
    });

    if (!media || !media.url) {
      throw new Error("No se pudo generar la imagen del look.");
    }

    return { previewImageDataUri: media.url };
  } catch (error: any) {
    console.error("Imagen 4 Grooming Error:", error);
    throw new Error("Error al visualizar el look estético con el nuevo motor.");
  }
}
