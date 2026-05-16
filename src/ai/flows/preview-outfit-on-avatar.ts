'use server';
/**
 * @fileOverview Probador Virtual Maestro.
 * Versión corregida para evitar el error 400.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()),
  biometricData: z.any().optional(),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const data = input.biometricData || {};
  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';

  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Describe brevemente cómo estas prendas visten a una persona en una sola toma de cuerpo completo."
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe este conjunto puesto sobre una persona (${personType}, pelo ${hairColor}).` },
          ...input.clothingItemsDataUris.map(url => ({ type: "image_url" as const, image_url: { url } })),
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const detailedDescription = analysisResponse.choices[0].message.content || "un conjunto de moda coordinado";

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A professional fashion photograph of ONE SINGLE ${personType}. Wearing exactly: ${detailedDescription}. Full length view from head to toe. Style: 3D character design, Pixar-inspired lighting. Background: Pure solid white void. No text, no lines.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const imageData = response.data[0].b64_json;
    if (!imageData) throw new Error("Error en la generación.");

    return {
      previewImageDataUri: `data:image/png;base64,${imageData}`
    };
  } catch (error: any) {
    console.error("DALL-E Error:", error);
    throw new Error(error.message || "Error al generar el probador virtual.");
  }
}
