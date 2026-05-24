'use server';
/**
 * @fileOverview Generación de Avatar Realista de Alta Fidelidad con Blindaje de Género.
 * Garantiza que el avatar respete estrictamente el género detectado o seleccionado.
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
  
  // REGLA MAESTRA: El género viene del perfil del usuario (biometricData.genero)
  const personType = data.genero || 'Femenino';
  const isMale = personType === 'Masculino';
  
  const genderTerm = isMale ? 'MAN' : 'WOMAN';
  const adjective = isMale ? 'MALE' : 'FEMALE';
  
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const hairDetail = data.rostro?.cabello?.color_detalle || '';
  const skinTone = data.colorimetria?.tono_piel || 'natural skin tone';
  const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';
  const facialStructure = data.rostro?.forma_rostro || 'natural facial structure';
  const bodySilhouette = data.cuerpo?.figure_geometrica || 'natural silhouette';
  
  const userId = input.userId || 'anonymous';
  const targetQuality = "medium"; 

  // Prompt ultra-reforzado para forzar género
  const finalPrompt = `PHOTOREALISTIC FULL-BODY EDITORIAL PORTRAIT OF A ${genderTerm}.

CRITICAL IDENTITY REQUIREMENT: THE SUBJECT MUST BE A ${genderTerm}.
- IF THE GENDER IS ${personType.toUpperCase()}, THE IMAGE MUST SHOW ONLY ${adjective} ANATOMY AND FEATURES.
- ${isMale ? 'Ensure a strong male jawline, broad male shoulders, masculine facial structure, and a male body type.' : 'Ensure female facial features, female shoulder width, and female body proportions.'}
- STATED GENDER: ${adjective}.
- ABSOLUTELY NO OPPOSITE GENDER TRAITS. NO ANDROGYNY.

FAITHFULNESS:
Preserve the person’s facial identity cues: face shape, forehead proportion, ${facialStructure} structure, jawline shape, nose shape, mouth shape, eye shape (${eyeColor}), skin tone (${skinTone}), hair color (${hairColor}), and hairstyle (${hairDetail}).

Preserve the person’s natural body proportions and general ${bodySilhouette} silhouette.

STYLE:
Realistic full-body fashion studio photograph. Soft neutral lighting, neutral clean background, realistic camera perspective, natural skin texture.

CLOTHING:
The ${genderTerm} is wearing simple neutral fitted professional clothing: plain fitted ${isMale ? 'male shirt' : 'female top'}, simple ${isMale ? 'trousers' : 'pants'}, and neutral shoes.

NO CARTOON, NO PIXAR STYLE, NO ANIMATED CHARACTER.`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1792" as any, // Formato más vertical para cuerpo completo
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
