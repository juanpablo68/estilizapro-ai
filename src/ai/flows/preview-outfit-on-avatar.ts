'use server';
/**
 * @fileOverview Probador Virtual usando gpt-image-2 sincronizado con el flujo de Avatar.
 * Procesa b64_json, sube a Firebase Storage y devuelve URL pública.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminStorage } from '@/lib/firebase-admin';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemsDataUris: z.array(z.string()),
  biometricData: z.any().optional(),
  openaiApiKey: z.string().optional(),
  userId: z.string().optional(),
});

export async function previewOutfitOnAvatar(input: z.infer<typeof PreviewOutfitOnAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Error 401: No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';
  const userId = input.userId || 'anonymous';

  // Análisis visual previo para generar el prompt descriptivo
  const analysis = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Describe este conjunto de ropa puesto sobre una persona en una sola frase técnica y visual." },
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

  console.log("Preview: Requesting gpt-image-2 (no response_format)...");

  try {
    const finalPrompt = `A professional high-end fashion photograph of ONE SINGLE ${gender}. Wearing: ${description}. Full body shot, neutral pose. STYLE: Modern 3D stylized character design. ENVIRONMENT: Pure solid white background. NO text.`;
    
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium" as any,
      // @ts-ignore
      output_format: "png"
    });

    console.log("OpenAI Preview image generated successfully");
    const b64Data = response.data[0].b64_json;

    if (!b64Data) {
      console.error("Preview Error: No b64_json received.");
      throw new Error("La IA no devolvió datos de imagen válidos.");
    }
    console.log("Base64 received successfully for outfit preview");

    const buffer = Buffer.from(b64Data, 'base64');
    console.log("Buffer created successfully for outfit preview");

    try {
      console.log("Uploading Preview to Firebase Storage...");
      const timestamp = Date.now();
      const fileName = `previews/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      console.log("Outfit preview upload to Storage completed");

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return { previewImageDataUri: downloadURL };
    } catch (storageError) {
      console.error("Storage Fallback for Preview:", storageError);
      return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
    }
  } catch (error: any) {
    console.error("Preview Generation Error (gpt-image-2):", error);
    if (error.status === 401) throw new Error("Error 401: API Key inválida.");
    throw new Error(error.message || "Error al generar el montaje visual.");
  }
}
