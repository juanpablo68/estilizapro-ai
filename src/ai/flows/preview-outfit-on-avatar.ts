
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

  const data = input.biometricData || {};
  const personType = data.genero || 'Femenino';
  const skinTone = data.colorimetria?.tono_piel || 'natural';
  const eyeColor = data.rostro?.ojos?.color_detalle || 'natural';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';

  // ETAPA 1: RAZONAMIENTO DE MODA (Analítico)
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un sastre digital. Describe cómo estas prendas se visten sobre una persona real, enfocándote en el ajuste, pliegues y texturas."
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe cómo esta persona (${personType}, ojos ${eyeColor}, pelo ${hairColor}) viste este conjunto. Asegura que la ropa se vea real y bien ajustada sobre un cuerpo completo.` },
          ...input.clothingItemsDataUris.map(url => ({ type: "image_url" as const, image_url: { url } })),
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const detailedDescription = analysisResponse.choices[0].message.content || "un conjunto de moda coordinado";

  // ETAPA 2: GENERACIÓN VISUAL (Fotográfica)
  // Se eliminan términos como "biometría" del prompt para evitar diagramas.
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `A professional wide-shot fashion photograph of one single ${personType} standing centrally.
    The person is wearing exactly this outfit: ${detailedDescription}.
    The shot is a full-length view from the top of the head to the bottom of the shoes. 
    
    STYLE: High-end 3D character design, Pixar-inspired lighting, realistic fabric textures. 
    The person has ${eyeColor} eyes, ${hairColor} hair, and ${skinTone} skin.
    
    COMPOSITION:
    - THE SUBJECT IS FULLY VISIBLE FROM HEAD TO TOE, INCLUDING ALL FOOTWEAR.
    - THE BACKGROUND IS A COMPLETELY PLAIN, SOLID, EMPTY, AND PURE WHITE (#FFFFFF) INFINITE VOID.
    - ABSOLUTELY NO TEXT, NO LINES, NO GRIDS, NO MEASUREMENTS, NO TECHNICAL OVERLAYS.
    - NO SECONDARY FIGURES OR MINIATURES IN THE BACKGROUND.
    - JUST ONE PERSON IN A PURE WHITE ENVIRONMENT.`,
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
