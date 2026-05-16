
'use server';
/**
 * @fileOverview Probador Virtual Maestro usando Imagen 4 (Motor Genkit ultra-estable).
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { ai, getOpenAIKey } from '@/ai/genkit';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()),
  biometricData: z.any().optional(),
  openaiApiKey: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el análisis de prendas.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';

  // El análisis de las prendas sigue usando GPT-4o Vision por su alta capacidad de comprensión
  const analysis = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Describe este conjunto de ropa puesto sobre una persona en una sola frase técnica y visual." },
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
    const finalPrompt = `A professional high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot. STYLE: Modern 3D stylized character design. ENVIRONMENT: Pure solid white background.`;
    
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: finalPrompt,
    });

    if (!media || !media.url) {
      throw new Error("No se pudo generar la vista previa visual.");
    }

    return { previewImageDataUri: media.url };
  } catch (error: any) {
    console.error("Imagen 4 Preview Error:", error);
    throw new Error("Error al generar el montaje visual con el nuevo motor.");
  }
}
