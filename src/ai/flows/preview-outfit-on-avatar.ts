'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual Multimodal: GPT-4o (Razonamiento) + DALL-E 3 (Arte).
 * Soporta múltiples prendas simultáneas para visualización de outfits completos.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()).describe('Lista de imágenes de las prendas seleccionadas'),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el Probador Virtual.");

  const openai = new OpenAI({ apiKey });

  // ETAPA 1: RAZONAMIENTO MULTIMODAL (Cerebro GPT-4o)
  // Analizamos el conjunto completo de prendas para entender capas y estilos.
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un ingeniero de prompts experto en moda y renderizado 3D Pixar. Tu tarea es describir un conjunto completo de prendas reales para que un generador de imágenes pueda ponerlas exactamente igual sobre un personaje animado, respetando capas (ej: camisa bajo chaqueta)."
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza estas prendas y el avatar base. Describe detalladamente cómo debe verse el conjunto completo puesto en el personaje Pixar, manteniendo la fidelidad de color, textura y diseño de cada pieza." },
          ...input.clothingItemsDataUris.map(url => ({ type: "image_url" as const, image_url: { url } })),
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const detailedDescription = analysisResponse.choices[0].message.content || "un conjunto de moda coordinado";

  // ETAPA 2: GENERACIÓN VISUAL (Artista DALL-E 3)
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Professional 3D fashion render in high-quality Disney/Pixar style. THE SAME CONSISTENT CHARACTER from the reference is now wearing THIS COMPLETE OUTFIT: ${detailedDescription}. PURE WHITE BACKGROUND. Full body head-to-toe shot. Perfect anatomical fit, cinematic lighting, vibrant clean textures. No text, no diagrams, just the character dressed.`,
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
