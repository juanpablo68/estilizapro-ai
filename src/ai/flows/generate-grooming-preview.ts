'use server';
/**
 * @fileOverview Generación de Visagismo usando gpt-image-2 con procesamiento b64 y fallback.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminStorage } from '@/lib/firebase-admin';

const GenerateGroomingPreviewInputSchema = z.object({
  description: z.string(),
  biometricData: z.any().optional(),
  hasBeard: z.boolean().optional(),
  openaiApiKey: z.string().optional(),
  userId: z.string().optional(),
});

export async function generateGroomingPreview(input: z.infer<typeof GenerateGroomingPreviewInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("Error 401: API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';
  const userId = input.userId || 'anonymous';
  
  const cleanDescription = input.description.split('.')[0].substring(0, 200);

  const finalPrompt = `Close-up high-end portrait of ONE SINGLE ${gender}. 
  STYLE: Modern 3D stylized character.
  LOOK: ${cleanDescription}. 
  ${gender === 'Masculino' && input.hasBeard ? 'With a perfectly groomed beard.' : ''}
  ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
  ENVIRONMENT: Solid pure white background. NO TEXT.`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    console.log("OpenAI Grooming image generated successfully");
    const b64Data = response.data[0].b64_json;
    if (!b64Data) throw new Error("No b64_json in response.");

    const buffer = Buffer.from(b64Data, 'base64');

    try {
      const timestamp = Date.now();
      const fileName = `grooming/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      console.log("Grooming upload completed");

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return { previewImageDataUri: downloadURL };
    } catch (storageError) {
      console.error("Storage Fallback for Grooming:", storageError);
      return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
    }
  } catch (error: any) {
    console.error("Grooming Image Error (gpt-image-2):", error);
    throw new Error(error.message || "Error al visualizar el look.");
  }
}
