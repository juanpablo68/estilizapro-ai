'use server';
/**
 * @fileOverview Generación de Avatar Estilizado usando gpt-image-2.
 * Procesa b64_json, sube a Firebase Storage y devuelve URL con fallback.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminStorage } from '@/lib/firebase-admin';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
  userId: z.string().optional(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Error 401: No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const skinTone = data.colorimetria?.tono_piel || 'light skin';
  const userId = input.userId || 'anonymous';

  const finalPrompt = `A professional high-end fashion portrait of ONE SINGLE ${personType}. 
  FEATURES: ${skinTone} skin, ${hairColor} hair.
  STYLE: Modern 3D stylized character design, high-end studio lighting. 
  COMPOSITION: Full length body shot, standing centrally, neutral pose, minimalist clothes.
  ENVIRONMENT: Solid pure white background. NO text.`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    console.log("OpenAI image generated successfully");
    const b64Data = response.data[0].b64_json;

    if (!b64Data) {
      console.error("Respuesta OpenAI sin b64_json:", JSON.stringify(response, null, 2));
      throw new Error("La IA no devolvió datos de imagen (b64_json) válidos.");
    }
    console.log("Base64 received successfully");

    const buffer = Buffer.from(b64Data, 'base64');
    console.log("Buffer created successfully");

    try {
      console.log("Uploading to Firebase Storage...");
      const timestamp = Date.now();
      const fileName = `avatars/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      console.log("Firebase Storage upload completed");

      console.log("Generating Firebase download URL");
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      return { avatarDataUri: downloadURL };
    } catch (storageError: any) {
      console.error("Firebase Storage Error (Refresco de Token o Permisos):", storageError);
      console.warn("Activando Fallback: Devolviendo Data URI directamente.");
      return { avatarDataUri: `data:image/png;base64,${b64Data}` };
    }
  } catch (error: any) {
    console.error("Image Generation Error (gpt-image-2):", error);
    if (error.status === 401) throw new Error("Error 401: API Key inválida.");
    if (error.status === 403) throw new Error("Error 403: Sin acceso al modelo o autorización.");
    if (error.status === 404) throw new Error("Error 404: Modelo gpt-image-2 no disponible.");
    if (error.status === 429) throw new Error("Error 429: Cuota excedida.");
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
