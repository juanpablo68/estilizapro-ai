
'use server';
/**
 * @fileOverview Probador Virtual usando el motor gpt-image-2 con b64_json.
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
  if (!apiKey) throw new Error("API Key de OpenAI requerida (401).");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';

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
    const finalPrompt = `A professional high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot. STYLE: Modern 3D stylized character design. ENVIRONMENT: Pure solid white background. NO text.`;
    
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const b64Data = response.data[0].b64_json;
    if (!b64Data) {
      console.error("Respuesta Probador sin b64_json:", JSON.stringify(response, null, 2));
      throw new Error("No se pudo generar el Base64 del montaje.");
    }

    return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
  } catch (error: any) {
    console.error("Preview Generation Error (gpt-image-2):", error);
    if (error.status === 404) throw new Error("Modelo gpt-image-2 no encontrado.");
    throw new Error(error.message || "Error al generar el montaje visual con gpt-image-2.");
  }
}
