'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual: Realismo fotorrealista.
 * Garantiza consistencia del avatar y visualización realista de prendas.
 * Asegura una toma de cuerpo completo desde la cabeza hasta los zapatos.
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
        content: "Eres un sastre digital de alta costura. Describe detalladamente cómo estas prendas reales se visten sobre una persona, enfocándote en pliegues, sombras naturales de la tela y texturas realistas."
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe cómo esta persona (${gender}, ojos ${eyes}, pelo ${hair}) viste este conjunto. Asegura que la ropa se vea real y bien ajustada sobre un cuerpo completo.` },
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
      A professional full-length standing fashion photograph of one single person. 
      The person is standing centrally against an empty, solid, pure white background (#FFFFFF).
      The person is a ${gender} with ${eyes} eyes, ${hair} hair, and ${skin} skin.
      OUTFIT: Wearing exactly this realistic clothing ensemble: ${detailedDescription}. 
      Style: Modern 3D high-end animation with ultra-realistic fabric textures, cinematic soft lighting.
      
      COMPOSITION:
      - THE PERSON IS FULLY VISIBLE FROM THE TOP OF THE HEAD TO THE BOTTOM OF THE SHOES.
      - ONLY ONE SINGLE PERSON IN THE FRAME.
      - BACKGROUND IS ABSOLUTELY PLAIN, SOLID, EMPTY AND PURE WHITE.
      - NO TEXT, NO LINES, NO GRIDS, NO MEASUREMENTS, NO SYMBOLS.
      - NO TECHNICAL OVERLAYS, NO DATA FIGURES, NO CHARTS.
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
