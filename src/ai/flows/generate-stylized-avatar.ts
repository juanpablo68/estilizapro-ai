'use server';
/**
 * @fileOverview Generación de Avatar Estilizado Profesional.
 * Versión ultra-estable sin parámetros experimentales.
 */

import { ai, getOpenAIKey } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
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
    const apiKey = getOpenAIKey(input.openaiApiKey);
    if (!apiKey) throw new Error("API Key de OpenAI no disponible.");

    const openai = new OpenAI({ apiKey });
    const data = input.biometricData || {};

    const personType = data.genero || 'Femenino';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural';
    const skinTone = data.colorimetria?.tono_piel || 'light skin';
    const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';

    const finalPrompt = `A high-end professional fashion editorial photograph of ONE SINGLE ${personType}. 
    PHYSICAL TRAITS: Skin tone ${skinTone}, Hair ${hairColor}, Eyes ${eyeColor}.
    STYLE: Modern 3D stylized character, Pixar-quality lighting. 
    COMPOSITION: Full length shot, standing centrally, neutral pose, minimalist fashion clothing.
    ENVIRONMENT: Solid pure white background (#FFFFFF). Clean, artistic, and minimalist.`;

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

      return { avatarDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Avatar Error:", error);
      throw new Error(error.message || "Error al generar el avatar estilizado.");
    }
  }
);
