
'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual.
 * Garantiza una única figura de cuerpo completo sin artefactos técnicos.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()),
  biometricData: z.any().optional(),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
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
        content: "Eres un sastre digital. Describe brevemente cómo estas prendas visten a una persona en una sola toma de cuerpo completo."
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

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `A professional fashion photograph of ONE SINGLE ${personType} standing centrally.
    The person is wearing exactly this outfit: ${detailedDescription}.
    FULL LENGTH VIEW: Visible from the top of the head to the very bottom of the shoes.
    
    STYLE: High-end 3D character design, Pixar-inspired lighting. 
    
    COMPOSITION:
    - THE SUBJECT IS FULLY VISIBLE FROM HEAD TO TOE, INCLUDING ALL FOOTWEAR.
    - THE BACKGROUND IS A COMPLETELY PLAIN, SOLID, EMPTY, AND PURE WHITE (#FFFFFF) INFINITE VOID.
    - ABSOLUTELY NO TEXT, NO LINES, NO GRIDS, NO MEASUREMENTS, NO TECHNICAL OVERLAYS, NO NUMBERS.
    - NO SECONDARY FIGURES, NO MINIATURES, NO DIAGRAMS.
    - JUST ONE PERSON IN A PURE WHITE ENVIRONMENT.`,
    n: 1,
    size: "1024x1024",
    quality: "hd",
    response_format: "b64_json",
  });

  const imageData = response.data[0].b64_json;
  if (!imageData) throw new Error("Error en la generación.");

  return {
    previewImageDataUri: `data:image/png;base64,${imageData}`
  };
}
