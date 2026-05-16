
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado de Alta Fidelidad usando gpt-image-2.
 * Procesa b64_json, sube a Firebase Storage y devuelve URL pública.
 * Optimizado para realismo fotográfico y fidelidad biométrica.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminStorage } from '@/lib/firebase-admin';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
  userId: z.string().optional(),
  finalAvatar: z.boolean().optional(),
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

  // Validación defensiva de calidad según especificación técnica de gpt-image-2
  const allowedQualities = ["low", "medium", "high", "auto"] as const;
  const targetQuality = input.finalAvatar === true ? "high" : "high"; // Forzamos high para fidelidad máxima

  // Prompt optimizado para realismo fotográfico y fidelidad a los rasgos detectados
  const finalPrompt = `A highly realistic, professional high-end fashion photograph of ONE SINGLE ${personType}. 
  EXACT FEATURES: ${skinTone} skin tone, ${hairColor} hair texture. Realistic human facial features and anatomy. 
  STYLE: Professional studio photography, soft cinematic lighting, sharp focus, 8k resolution.
  COMPOSITION: Full body shot, standing centrally, neutral elegant pose, wearing simple contemporary minimalist clothing.
  ENVIRONMENT: Solid pure white studio background. NO text, no cartoons, no 3D stylized characters, strictly realistic photography.`;

  console.log(`Requesting high-fidelity image from gpt-image-2 (quality: ${targetQuality}, size: 1024x1536)...`);

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1536" as any, // Proporción vertical optimizada para cuerpo completo
      quality: targetQuality as any,
      // @ts-ignore
      output_format: "png"
    });

    console.log("OpenAI image generated successfully");
    const b64Data = response.data[0].b64_json;

    if (!b64Data) {
      console.error("OpenAI Response Error: b64_json is missing. Full response:", JSON.stringify(response));
      throw new Error("La IA no devolvió datos de imagen (b64_json) válidos.");
    }
    console.log("Base64 received successfully");

    const buffer = Buffer.from(b64Data, 'base64');
    console.log("Buffer created successfully");

    try {
      console.log("Uploading high-res avatar to Firebase Storage...");
      const timestamp = Date.now();
      const fileName = `avatars/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      console.log("Firebase Storage upload completed");

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      // Devolvemos ambos para satisfacer el requisito de imageUrl sin romper el frontend
      return { 
        avatarDataUri: downloadURL,
        imageUrl: downloadURL 
      };
    } catch (storageError: any) {
      console.error("Firebase Storage Auth/Upload Error:", storageError);
      // Fallback a Data URI si el almacenamiento falla
      return { 
        avatarDataUri: `data:image/png;base64,${b64Data}`,
        imageUrl: `data:image/png;base64,${b64Data}`
      };
    }
  } catch (error: any) {
    console.error("Image Generation Error (gpt-image-2):", error);
    if (error.status === 401) throw new Error("Error 401: API Key inválida o mal configurada.");
    if (error.status === 403) throw new Error("Error 403: El proyecto no tiene autorización para este modelo o parámetros.");
    if (error.status === 404) throw new Error("Error 404: El modelo gpt-image-2 no está disponible o el nombre es incorrecto.");
    if (error.status === 429) throw new Error("Error 429: Cuota excedida o crédito insuficiente.");
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
