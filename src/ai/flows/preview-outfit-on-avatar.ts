
'use server';
/**
 * @fileOverview Previsualización de ropa en avatar utilizando Pure OpenAI Architecture.
 * GPT-4o analiza la prenda y DALL-E 3 la visualiza en el personaje.
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
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  // Razonamiento Multimodal con GPT-4o para describir la prenda
  const visionResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe detalladamente esta prenda de vestir para que DALL-E 3 pueda ponérsela a un personaje 3D Pixar. Sé muy específico con el color, tejido y forma." },
          { type: "image_url", image_url: { url: input.clothingItemDataUri } }
        ],
      },
    ],
  });

  const description = visionResponse.choices[0].message.content || "prenda de vestir moderna";

  // Generación Visual con DALL-E 3
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `A high-quality 3D Pixar-style animated character wearing exactly this item: ${description}. The character should be the same consistent fashion avatar. PURE WHITE BACKGROUND. Cinematic lighting, vibrant colors. Professional render.`,
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
