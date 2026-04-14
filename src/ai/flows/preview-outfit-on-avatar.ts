
'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual: GPT-4o + DALL-E 3.
 * Garantiza consistencia del avatar y visualización realista de prendas sin elementos técnicos.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()).describe('Lista de imágenes de las prendas seleccionadas'),
  biometricData: z.any().optional().describe('Datos para mantener la consistencia del personaje'),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el Probador Virtual.");

  const openai = new OpenAI({ apiKey });

  const bio = input.biometricData || {};
  const gender = bio.genero || 'Femenino';
  const skin = bio.colorimetria?.tono_piel || 'natural skin tone';
  const eyes = bio.rostro?.ojos?.color_detalle || 'natural eyes';
  const hair = bio.rostro?.cabello?.color_natural || 'natural hair';

  // ETAPA 1: RAZONAMIENTO DE MODA
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un sastre digital. Describe cómo estas prendas reales se ajustan a un personaje 3D. Enfócate en texturas de tela, pliegues naturales y combinación de colores."
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe cómo el personaje (${gender}, ojos ${eyes}, pelo ${hair}) viste este conjunto. Asegura realismo en las texturas.` },
          ...input.clothingItemsDataUris.map(url => ({ type: "image_url" as const, image_url: { url } })),
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const detailedDescription = analysisResponse.choices[0].message.content || "un conjunto de moda coordinado";

  // ETAPA 2: GENERACIÓN VISUAL DE ALTA FIDELIDAD
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `
      A STUNNING FULL-LENGTH FASHION RENDER OF ONE SINGLE PERSON.
      CHARACTER: THE SAME CONSISTENT ${gender} with ${eyes} eyes, ${hair} hair, and ${skin} skin.
      OUTFIT: Wearing exactly these items: ${detailedDescription}. 
      STYLE: Modern 3D character animation (Pixar style) with realistic fabric textures.
      
      COMPOSITION:
      - ONLY ONE PERSON: No side views, no duplicates, no split screen.
      - FULL BODY SHOT: Head to toe, including shoes. Standing naturally.
      - BACKGROUND: Absolute plain white #FFFFFF background. No floor textures, no grids, no rulers.
      
      FORBIDDEN ELEMENTS:
      - NO technical lines, NO measurement markers, NO wireframes.
      - NO circles around the body, NO HUD, NO labels.
      - NO architectural backgrounds.
    `,
    n: 1,
    size: "1024x1024",
    quality: "hd",
    response_format: "b64_json",
  });

  const imageData = response.data[0].b64_json;
  if (!imageData) throw new Error("Error en la generación visual del montaje.");

  return {
    previewImageDataUri: `data:image/png;base64,${imageData}`
  };
}
