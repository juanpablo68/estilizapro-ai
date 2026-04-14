
'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual: Realismo fotorrealista.
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
        content: "Eres un sastre digital de alta costura. Describe detalladamente cómo estas prendas reales se visten sobre una persona, enfocándote en pliegues, sombras naturales de la tela y texturas realistas (algodón, seda, cuero, etc.)."
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe cómo esta persona (${gender}, ojos ${eyes}, pelo ${hair}) viste este conjunto. Asegura que la ropa se vea real, tridimensional y bien ajustada.` },
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
      A STUNNING FULL-LENGTH FASHION MAGAZINE RENDER OF ONE SINGLE PERSON.
      CHARACTER: A STANDING ${gender} with ${eyes} eyes, ${hair} hair, and ${skin} skin.
      OUTFIT: Wearing exactly this realistic clothing ensemble: ${detailedDescription}. 
      STYLE: Modern 3D high-end animation with ultra-realistic fabric textures, cinematic soft lighting.
      
      COMPOSITION:
      - ONLY ONE PERSON IN THE IMAGE. ONE SINGLE POSE.
      - FULL BODY VIEW FROM HEAD TO TOE. 
      - BACKGROUND: ABSOLUTELY PLAIN EMPTY WHITE STUDIO BACKGROUND (#FFFFFF). 
      
      STRICT CONSTRAINTS:
      - NO MEASUREMENTS, NO GRIDS, NO RULERS, NO TECHNICAL SYMBOLS.
      - NO SPLIT SCREENS, NO MULTIPLE VIEWS, NO DIAGRAMS.
      - NO NUMBERS, NO HUD, NO TEXT, NO LABELS.
      - NO HORIZON LINES, NO FLOOR TEXTURES.
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
