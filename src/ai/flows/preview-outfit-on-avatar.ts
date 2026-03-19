'use server';
/**
 * @fileOverview Pipeline Maestro de Probador Virtual: GPT-4o (Razonamiento) + DALL-E 3 (Arte).
 * 
 * 1. GPT-4o analiza la prenda real y su interacción con el avatar 3D.
 * 2. DALL-E 3 (gpt-image-1.5) genera la visualización del montaje.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemDataUri: z.string(),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el Probador Virtual.");

  const openai = new OpenAI({ apiKey });

  // ETAPA 1: RAZONAMIENTO MULTIMODAL (Cerebro GPT-4o)
  // Analizamos la prenda para entender su tejido, caída y detalles técnicos.
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un ingeniero de prompts experto en moda y renderizado 3D Pixar. Tu tarea es describir una prenda real para que un generador de imágenes pueda ponerla exactamente igual sobre un personaje animado."
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza esta prenda y el avatar base. Describe detalladamente cómo debe ajustarse la prenda al cuerpo del personaje Pixar, respetando el color, textura y forma original de la ropa." },
          { type: "image_url", image_url: { url: input.clothingItemDataUri } },
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const detailedDescription = analysisResponse.choices[0].message.content || "una prenda de moda moderna";

  // ETAPA 2: GENERACIÓN VISUAL (Artista DALL-E 3 / gpt-image-1.5)
  // Generamos el montaje final del personaje vestido.
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Professional 3D fashion render in high-quality Disney/Pixar style. The consistent character from the reference is now wearing exactly this: ${detailedDescription}. PURE WHITE BACKGROUND. Perfect anatomical fit, cinematic lighting, vibrant colors. Full body shot, masterpiece quality, 8k resolution feel, but optimized for web.`,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    response_format: "b64_json",
  });

  const imageData = response.data[0].b64_json;
  if (!imageData) throw new Error("Error en la generación visual del montaje.");

  return {
    previewImageDataUri: `data:image/png;base64,${imageData}`
  };
}
