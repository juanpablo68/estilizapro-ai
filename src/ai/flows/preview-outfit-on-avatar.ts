'use server';
/**
 * @fileOverview Probador Virtual Maestro.
 * Configuración de imagen limpia sin parámetros conflictivos.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()),
  biometricData: z.any().optional(),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';

  // Primero analizamos el conjunto para tener una descripción visual
  const analysis = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Describe este outfit de moda puesto sobre una persona en una sola frase descriptiva." },
      {
        role: "user",
        content: [
          { type: "text", text: `Describe este outfit puesto sobre un ${gender}.` },
          ...input.clothingItemsDataUris.map(url => ({ type: "image_url" as const, image_url: { url } })),
          { type: "image_url", image_url: { url: input.avatarDataUri } }
        ],
      },
    ],
  });

  const description = analysis.choices[0].message.content || "a stylish fashion outfit";

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot. STYLE: Modern 3D stylized character design. ENVIRONMENT: Pure solid white background.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const imageData = response.data[0].b64_json;
    if (!imageData) throw new Error("Error visual.");

    return { previewImageDataUri: `data:image/png;base64,${imageData}` };
  } catch (error: any) {
    console.error("DALL-E Preview Error:", error);
    throw new Error("No se pudo generar la vista previa del conjunto.");
  }
}
