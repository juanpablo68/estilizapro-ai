'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual Multimodal: GPT-4o (Razonamiento) + DALL-E 3 (Arte).
 * Asegura consistencia absoluta del avatar y realismo quirúrgico de las prendas.
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

  // Extracción de rasgos para consistencia
  const bio = input.biometricData || {};
  const gender = bio.genero || 'Femenino';
  const skin = bio.colorimetria?.tono_piel || 'natural skin tone';
  const eyes = bio.rostro?.ojos?.color_detalle || 'natural eyes';
  const hair = bio.rostro?.cabello?.color_natural || 'natural hair';

  // ETAPA 1: RAZONAMIENTO DE MODA (Cerebro GPT-4o)
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un sastre digital y experto en renderizado 3D fotorrealista. Tu misión es describir cómo se deben ver estas prendas REALES puestas sobre un personaje. Enfócate en la textura de la tela, el ajuste al cuerpo y las capas naturales."
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe detalladamente cómo el personaje (${gender}, ojos ${eyes}, pelo ${hair}) debe vestir este conjunto. Asegura que la ropa parezca real, con arrugas naturales y texturas fieles a la foto de la prenda.` },
          ...input.clothingItemsDataUris.map(url => ({ type: "image_url" as const, image_url: { url } })),
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const detailedDescription = analysisResponse.choices[0].message.content || "un conjunto de moda coordinado";

  // ETAPA 2: GENERACIÓN VISUAL DE ALTA FIDELIDAD (Artista DALL-E 3)
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `
      A STUNNING FULL-LENGTH FASHION RENDER. 
      CHARACTER: THE SAME CONSISTENT CHARACTER: A ${gender} with ${eyes} eyes, ${hair} hair, and ${skin} skin.
      OUTFIT: Wearing exactly these items: ${detailedDescription}. 
      STYLE: High-end 3D character animation (Pixar style) but with hyper-realistic fabric textures.
      COMPOSITION:
      - FULL BODY SHOT: From head to toe, feet and shoes must be clearly visible and within the frame.
      - STANDING POSITION: Standing upright on a plain surface.
      - PURE SOLID WHITE BACKGROUND: Absolute #FFFFFF white background. No floor lines, no grids, no shadows on walls.
      - HIGH FIDELITY: The clothes must look realistically fitted to the 3D body, showing accurate colors and material properties.
      
      STRICT NEGATIVE CONSTRAINTS:
      - NO wireframes, NO measurement lines, NO circles, NO HUD.
      - NO text, NO labels, NO anatomical diagrams.
      - NO blurred backgrounds, NO interior rooms.
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
