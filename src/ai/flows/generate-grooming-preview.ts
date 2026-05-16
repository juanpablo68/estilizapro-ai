'use server';
/**
 * @fileOverview Generación de Visagismo usando gpt-image-2 sincronizado con el flujo de Avatar.
 * Procesa b64_json, sube a Firebase Storage y devuelve URL pública.
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
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Error 401: No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const gender = data.genero || 'Femenino';
  const userId = input.userId || 'anonymous';
  
  // Limpieza de descripción para evitar prompts excesivos
  const cleanDescription = input.description.split('.')[0].substring(0, 300);

  const finalPrompt = `A high-end professional beauty portrait of ONE SINGLE ${gender}. 
  LOOK: ${cleanDescription}. 
  ${gender === 'Masculino' && input.hasBeard ? 'With a perfectly detailed groomed beard.' : ''}
  ${gender === 'Masculino' && !input.hasBeard ? 'Clean-shaven face.' : ''}
  STYLE: Modern 3D stylized character design, high-end studio lighting. 
  COMPOSITION: Extreme close-up face portrait, solid pure white background. NO text.`;

  console.log("Grooming: Requesting gpt-image-2 (no response_format)...");

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium" as any,
      // @ts-ignore
      output_format: "png"
    });

    console.log("OpenAI Grooming image generated successfully");
    const b64Data = response.data[0].b64_json;

    if (!b64Data) {
      console.error("Grooming Error: No b64_json in response.");
      throw new Error("La IA no devolvió datos de imagen válidos.");
    }
    console.log("Base64 received successfully for grooming");

    const buffer = Buffer.from(b64Data, 'base64');
    console.log("Buffer created successfully for grooming");

    try {
      console.log("Uploading Grooming to Firebase Storage...");
      const timestamp = Date.now();
      const fileName = `grooming/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      console.log("Grooming Storage upload completed");

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return { previewImageDataUri: downloadURL };
    } catch (storageError) {
      console.error("Storage Fallback for Grooming:", storageError);
      return { previewImageDataUri: `data:image/png;base64,${b64Data}` };
    }
  } catch (error: any) {
    console.error("Grooming Image Generation Error (gpt-image-2):", error);
    if (error.status === 401) throw new Error("Error 401: API Key inválida.");
    if (error.status === 429) throw new Error("Error 429: Cuota o límite excedido.");
    throw new Error(error.message || "Error al generar la vista previa del look.");
  }
}
