
'use server';
/**
 * @fileOverview Generación de Avatar Realista de Alta Fidelidad con Blindaje de Género.
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
  const hairDetail = data.rostro?.cabello?.color_detalle || '';
  const skinTone = data.colorimetria?.tono_piel || 'natural skin tone';
  const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';
  const facialStructure = data.rostro?.forma_rostro || 'natural facial structure';
  const bodySilhouette = data.cuerpo?.figure_geometrica || 'natural silhouette';
  
  const userId = input.userId || 'anonymous';
  const targetQuality = "medium"; 

  const finalPrompt = `Create a highly realistic full-body editorial fashion avatar.

CRITICAL IDENTITY RULE: The subject MUST be ${personType}. 
If ${personType} is "Masculino", generate a clear MALE avatar with male facial features and male body proportions. 
If ${personType} is "Femenino", generate a clear FEMALE avatar with female facial features and female body proportions.
DO NOT MIX GENDER TRAITS.

FAITHFULNESS:
Preserve the person’s facial identity cues as closely as possible: face shape, forehead proportion, ${facialStructure} structure, jawline shape, nose shape, mouth shape, eye shape (${eyeColor}), skin tone (${skinTone}), hair color (${hairColor}), and hairstyle (${hairDetail}).

Preserve the person’s natural body proportions, general ${bodySilhouette} silhouette, and stance.

STYLE:
Generate a realistic full-body fashion studio image with soft neutral lighting, neutral background, realistic camera perspective, and natural skin texture.

The avatar should wear simple neutral fitted clothing suitable for fashion analysis: plain fitted top, simple pants, and neutral shoes.

NO cartoon, NO Pixar style, NO animated character, NO toy-like appearance, NO oversized eyes.`;

  const startTime = Date.now();
  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1536" as any,
      quality: targetQuality as any,
      // @ts-ignore
      output_format: "png"
    });

    const b64Data = response.data[0].b64_json;
    if (!b64Data) throw new Error("La IA no devolvió datos de imagen válidos.");

    const buffer = Buffer.from(b64Data, 'base64');

    try {
      const timestamp = Date.now();
      const fileName = `avatars/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return { 
        avatarDataUri: downloadURL,
        imageUrl: downloadURL 
      };
    } catch (storageError: any) {
      return { 
        avatarDataUri: `data:image/png;base64,${b64Data}`,
        imageUrl: `data:image/png;base64,${b64Data}`
      };
    }
  } catch (error: any) {
    console.error("Avatar Generation Error:", error);
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
