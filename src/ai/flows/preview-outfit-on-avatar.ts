'use server';
/**
 * @fileOverview Probador Virtual usando gpt-image-2.
 * Retorna el resultado en Base64 para persistencia 100% local en el equipo del usuario.
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
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Error 401: No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });
  const gender = input.biometricData?.genero || 'Femenino';

  try {
    // Análisis visual previo para generar el prompt descriptivo
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Describe este conjunto de ropa puesto sobre una persona en una sola frase técnica." },
        {
          role: "user",
          content: [
            { type: "text", text: `Describe este outfit puesto sobre un ${gender}.` },
            ...input.clothingItemsDataUris.slice(0, 3).map(url => ({ type: "image_url" as const, image_url: { url } })),
            { type: "image_url", image_url: { url: input.avatarDataUri } }
          ],
        },
      ],
    });

    const description = analysis.choices[0].message.content || "a stylish fashion outfit";
    const finalPrompt = `A professional high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot, neutral pose, pure solid white background. NO text.`;
    
    console.log("Calling gpt-image-2 for preview without response_format");

    // IMPORTANTE:
    // No agregar response_format con gpt-image-2.
    // Causaba error 400. Se lee b64_json por defecto.
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium" as any,
    });

    const b64Data = response.data?.[0]?.b64_json;
    if (!b64Data) {
      console.error("Respuesta completa OpenAI Preview:", JSON.stringify(response, null, 2));
      throw new Error("La IA no devolvió datos de imagen válidos.");
    }

    return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
  } catch (error: any) {
    console.error("Preview Generation Error:", error);
    throw new Error(error.message || "Error al generar el montaje visual.");
  }
}
