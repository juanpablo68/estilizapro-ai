'use server';
/**
 * @fileOverview Generación de Avatar Realista de Alta Fidelidad con Blindaje de Género.
 * Utiliza rasgos faciales específicos para garantizar que el avatar represente fielmente al usuario.
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
  
  // REGLA MAESTRA: El género viene del perfil del usuario
  const personType = data.genero || 'Femenino';
  const isMale = personType === 'Masculino';
  
  const genderTerm = isMale ? 'MAN' : 'WOMAN';
  const adjective = isMale ? 'MALE' : 'FEMALE';
  
  // Rasgos faciales específicos para mayor realismo
  const faceShape = data.rostro?.forma_rostro || 'natural facial structure';
  const jawline = data.rostro?.mandibula || '';
  const nose = data.rostro?.nariz || '';
  const forehead = data.rostro?.frente || '';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const hairDetail = data.rostro?.cabello?.color_detalle || '';
  const skinTone = data.colorimetria?.tono_piel || 'natural skin tone';
  const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';
  const bodySilhouette = data.cuerpo?.figure_geometrica || 'natural silhouette';
  
  const userId = input.userId || 'anonymous';

  // Prompt ultra-detallado para fidelidad de identidad
  const finalPrompt = `PHOTOREALISTIC FULL-BODY EDITORIAL FASHION PORTRAIT OF A ${genderTerm}.

CRITICAL IDENTITY FIDELITY:
The subject's face MUST be based on these specific detected traits to ensure it's a faithful representation of this specific individual, NOT a generic person:
- Face Shape: ${faceShape}
- Jawline: ${jawline}
- Nose: ${nose}
- Forehead: ${forehead}
- Eyes: ${eyeColor}
- Skin Tone: ${skinTone}
- Hair: ${hairColor}, ${hairDetail}

CRITICAL GENDER REQUIREMENT:
- THE SUBJECT IS A ${genderTerm}.
- IF ${personType.toUpperCase()}, ENSURE ${isMale ? 'MASCULINE FACIAL BONE STRUCTURE, BROAD SHOULDERS, AND MALE ANATOMY' : 'FEMININE FACIAL FEATURES, FEMALE SHOULDERS, AND FEMALE ANATOMY'}.
- NO ANDROGYNY. ABSOLUTELY NO OPPOSITE GENDER TRAITS.

STYLE:
Realistic full-body fashion studio photograph. 8k resolution, high-end commercial lighting, neutral studio background. Natural skin texture (not plastic).

BODY:
Preserve the subject's ${bodySilhouette} body type and proportions.

CLOTHING:
The ${genderTerm} is wearing simple high-quality neutral professional clothing (plain fitted ${isMale ? 'shirt' : 'top'} and trousers) to focus on identity.

NO CARTOON, NO ANIMATED STYLE, NO GENERIC FACES.`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1792" as any, 
      quality: "medium" as any,
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
    throw new Error(error.message || "Error al conectar con el motor de imagen.");
  }
}
