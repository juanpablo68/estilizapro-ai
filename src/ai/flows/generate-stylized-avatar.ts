
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado de Alta Fidelidad usando gpt-image-2.
 * Procesa b64_json, sube a Firebase Storage y devuelve URL pública.
 * Optimizado para realismo fotográfico y estabilidad (prevención de timeouts).
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

  // Validación defensiva de calidad. 
  // USAMOS "medium" para evitar timeouts (45s+) mientras se estabiliza el entorno.
  const targetQuality = "medium"; 

  // Prompt optimizado para realismo fotográfico
  const finalPrompt = `A highly realistic, professional high-end fashion photograph of ONE SINGLE ${personType}. 
  EXACT FEATURES: ${skinTone} skin tone, ${hairColor} hair texture. Realistic human facial features and anatomy. 
  STYLE: Professional studio photography, soft cinematic lighting, sharp focus, 8k resolution.
  COMPOSITION: Full body shot, standing centrally, neutral elegant pose, wearing simple contemporary minimalist clothing.
  ENVIRONMENT: Solid pure white studio background. NO text, no cartoons, no 3D stylized characters, strictly realistic photography.`;

  const startTime = Date.now();
  console.log(">>> Avatar generation process started");

  try {
    console.log(`>>> Calling OpenAI (model: gpt-image-2, quality: ${targetQuality}, size: 1024x1536)...`);
    
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1536" as any,
      quality: targetQuality as any,
      // @ts-ignore
      output_format: "png"
    });

    console.log(`>>> OpenAI response received in ${Date.now() - startTime}ms`);
    
    const b64Data = response.data[0].b64_json;

    if (!b64Data) {
      console.error(">>> OpenAI Error: b64_json is missing.");
      throw new Error("La IA no devolvió datos de imagen (b64_json) válidos.");
    }

    console.log(">>> Creating image buffer...");
    const buffer = Buffer.from(b64Data, 'base64');
    console.log(`>>> Buffer created. Total elapsed: ${Date.now() - startTime}ms`);

    try {
      console.log(">>> Uploading avatar to Firebase Storage...");
      const timestamp = Date.now();
      const fileName = `avatars/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      
      console.log(`>>> Firebase upload completed in ${Date.now() - startTime}ms`);

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      console.log(`>>> Avatar flow successfully finished in ${Date.now() - startTime}ms`);
      
      return { 
        avatarDataUri: downloadURL,
        imageUrl: downloadURL 
      };
    } catch (storageError: any) {
      console.error(">>> Storage Fallback Error:", storageError.message);
      // Fallback a Data URI si el almacenamiento falla
      return { 
        avatarDataUri: `data:image/png;base64,${b64Data}`,
        imageUrl: `data:image/png;base64,${b64Data}`
      };
    }
  } catch (error: any) {
    console.error(">>> Image Generation Error (gpt-image-2):", error);
    
    // Manejo de timeout o errores de red inesperados
    const errorMsg = error.message?.toLowerCase() || "";
    if (
      errorMsg.includes("timeout") ||
      errorMsg.includes("network") ||
      errorMsg.includes("unexpected response")
    ) {
      throw new Error("La generación del avatar tardó demasiado o hubo un corte de red. Por favor, intenta nuevamente en unos segundos.");
    }

    if (error.status === 401) throw new Error("Error 401: API Key de OpenAI inválida.");
    if (error.status === 429) throw new Error("Error 429: Cuota de OpenAI excedida o límite de velocidad.");
    
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
