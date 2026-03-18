
'use server';
/**
 * @fileOverview Previsualización de ropa en avatar utilizando OpenAI DALL-E 3.
 * Gemini analiza la prenda y OpenAI la visualiza en el personaje.
 */

import { getGenkitEngine } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemDataUri: z.string(),
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const openAIKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!openAIKey) throw new Error("API Key de OpenAI requerida.");

  const { ai, model } = getGenkitEngine(input.geminiApiKey);
  const openai = new OpenAI({ apiKey: openAIKey });

  // Gemini (El Cerebro) analiza la prenda para describirla
  const { text: description } = await ai.generate({
    model: model,
    prompt: [
      { media: { url: input.clothingItemDataUri, contentType: 'image/jpeg' } },
      { text: 'Describe detalladamente esta prenda de vestir para que una IA generadora de imágenes pueda ponérsela a un personaje 3D Pixar. Sé muy específico con el color, tejido y forma.' }
    ]
  });

  // OpenAI (El Artista) genera la imagen final
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `A 3D Pixar-style animated character wearing this specific item: ${description}. The character should look consistent with a fashion avatar. High quality, cinematic lighting, plain background. Professional render.`,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });

  const imageData = response.data[0].b64_json;
  if (!imageData) throw new Error("Error al generar la vista previa visual.");

  return {
    previewImageDataUri: `data:image/png;base64,${imageData}`
  };
}
