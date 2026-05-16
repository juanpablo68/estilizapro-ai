'use server';
/**
 * @fileOverview Generación de Avatar Estilizado usando Imagen 4 (Motor ultra-estable).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
});

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>): Promise<z.infer<typeof GenerateStylizedAvatarOutputSchema>> {
  return generateStylizedAvatarFlow(input);
}

const generateStylizedAvatarFlow = ai.defineFlow(
  {
    name: 'generateStylizedAvatarFlow',
    inputSchema: GenerateStylizedAvatarInputSchema,
    outputSchema: GenerateStylizedAvatarOutputSchema,
  },
  async (input) => {
    const data = input.biometricData || {};
    const personType = data.genero || 'Femenino';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural';
    const skinTone = data.colorimetria?.tono_piel || 'light skin';

    const finalPrompt = `A high-end professional fashion portrait of ONE SINGLE ${personType}. 
    FEATURES: ${skinTone} skin, ${hairColor} hair.
    STYLE: Modern 3D stylized character design, high-end studio lighting. 
    COMPOSITION: Full length body shot, standing centrally, neutral pose, minimalist clothes.
    ENVIRONMENT: Solid pure white background.`;

    try {
      // Uso de Imagen 4 a través de Genkit (Motor más moderno y estable)
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: finalPrompt,
      });

      if (!media?.url) {
        throw new Error("El motor visual Imagen 4 no devolvió una imagen.");
      }

      return { avatarDataUri: media.url };
    } catch (error: any) {
      console.error("Imagen 4 Avatar Error:", error);
      throw new Error("Error al conectar con el motor visual de nueva generación.");
    }
  }
);
