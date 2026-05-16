
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado usando Imagen 4 (Motor Genkit ultra-estable).
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>) {
  const data = input.biometricData || {};
  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const skinTone = data.colorimetria?.tono_piel || 'light skin';

  const finalPrompt = `A professional high-end fashion portrait of ONE SINGLE ${personType}. 
  FEATURES: ${skinTone} skin, ${hairColor} hair.
  STYLE: Modern 3D stylized character design, high-end studio lighting. 
  COMPOSITION: Full length body shot, standing centrally, neutral pose, minimalist clothes.
  ENVIRONMENT: Solid pure white background.`;

  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: finalPrompt,
    });

    if (!media || !media.url) {
      throw new Error("El motor visual no devolvió una imagen válida.");
    }

    return { avatarDataUri: media.url };
  } catch (error: any) {
    console.error("Imagen 4 Avatar Error:", error);
    throw new Error("Error al conectar con el motor visual de nueva generación.");
  }
}
