
'use server';
/**
 * @fileOverview Previsualización de ropa en avatar utilizando OpenAI DALL-E 3.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemDataUri: z.string(),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  // Primero usamos Gemini para "entender" la prenda y describirla para DALL-E
  const { text: description } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: [
      { media: { url: input.clothingItemDataUri, contentType: 'image/jpeg' } },
      { text: 'Describe detalladamente esta prenda de vestir para que una IA generadora de imágenes pueda ponérsela a un personaje 3D Pixar.' }
    ]
  });

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `A 3D Pixar-style animated character wearing this specific item: ${description}. The character should look consistent with a fashion avatar. High quality, cinematic lighting, plain background.`,
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
