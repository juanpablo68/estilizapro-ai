'use server';
/**
 * @fileOverview Probador Virtual Maestro usando GPT-4o para análisis e Imagen 4 para visualización.
 */

import { ai } from '@/ai/genkit';
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
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el análisis visual.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';

  // Paso 1: Analizar el outfit con GPT-4o Vision
  const analysis = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Describe este outfit de moda puesto sobre una persona en una sola frase descriptiva corta." },
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
    // Paso 2: Generar la imagen con Imagen 4 (Genkit)
    const finalPrompt = `A high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot. STYLE: Modern 3D stylized character design. ENVIRONMENT: Pure solid white background.`;
    
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: finalPrompt,
    });

    if (!media?.url) throw new Error("Error visual con Imagen 4.");

    return { previewImageDataUri: media.url };
  } catch (error: any) {
    console.error("Imagen 4 Preview Error:", error);
    throw new Error("No se pudo generar la vista previa del conjunto con el nuevo motor.");
  }
}
