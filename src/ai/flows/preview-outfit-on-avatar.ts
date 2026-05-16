
'use server';
/**
 * @fileOverview Probador Virtual Maestro usando DALL-E 3 con descarga segura.
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

  // Paso 1: Análisis visual del conjunto
  const analysis = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Describe este outfit de moda puesto sobre una persona en una sola frase corta." },
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
    const finalPrompt = `A high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot. STYLE: Modern 3D stylized character design. ENVIRONMENT: Pure solid white background.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) throw new Error("No se pudo generar la vista previa.");

    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    return { previewImageDataUri: base64 };
  } catch (error: any) {
    console.error("DALL-E Preview Error:", error);
    throw new Error("No se pudo generar la vista previa visual.");
  }
}
