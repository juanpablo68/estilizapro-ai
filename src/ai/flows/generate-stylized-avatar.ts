'use server';
/**
 * @fileOverview Generación de Avatar Estilizado.
 * Versión de ultra-estabilidad: Descarga la imagen manualmente para evitar Error 400.
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
    if (!apiKey) throw new Error("API Key de OpenAI requerida.");

    const openai = new OpenAI({ apiKey });
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
      // Configuración minimalista extrema para evitar Error 400
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) throw new Error("La IA no devolvió una URL de imagen.");

      // Descargamos la imagen y la convertimos a base64 en el servidor
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      return { avatarDataUri: `data:${contentType};base64,${base64}` };
    } catch (error: any) {
      console.error("DALL-E Avatar Error:", error);
      throw new Error(error.message || "Error al conectar con el motor de imágenes.");
    }
  }
);
