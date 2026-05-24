'use server';
/**
 * @fileOverview Generación de Avatar Realista de Alta Fidelidad con Blindaje de Género.
 * Retorna la imagen en Base64 para ser guardada localmente por el cliente en IndexedDB.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

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
  
  // REGLA MAESTRA: El género viene del perfil del usuario
  const personType = data.genero || 'Femenino';
  const isMale = personType === 'Masculino';
  
  const genderTerm = isMale ? 'MAN' : 'WOMAN';
  
  // Rasgos faciales específicos para mayor realismo
  const faceShape = data.rostro?.forma_rostro || 'natural facial structure';
  const jawline = data.rostro?.mandibula || '';
  const nose = data.rostro?.nariz || '';
  const forehead = data.rostro?.frente || '';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const skinTone = data.colorimetria?.tono_piel || 'natural skin tone';
  const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';
  const bodySilhouette = data.cuerpo?.figure_geometrica || 'natural silhouette';

  const finalPrompt = `PHOTOREALISTIC FULL-BODY EDITORIAL FASHION PORTRAIT OF A ${genderTerm}.

CRITICAL IDENTITY FIDELITY:
The subject's face MUST be based on these specific detected traits to ensure it's a faithful representation:
- Face Shape: ${faceShape}
- Jawline: ${jawline}
- Nose: ${nose}
- Forehead: ${forehead}
- Eyes: ${eyeColor}
- Skin Tone: ${skinTone}
- Hair: ${hairColor}

CRITICAL GENDER REQUIREMENT:
- THE SUBJECT IS A ${genderTerm}.
- ENSURE ${isMale ? 'MASCULINE FACIAL BONE STRUCTURE AND MALE ANATOMY' : 'FEMININE FACIAL FEATURES AND FEMALE ANATOMY'}.
- NO ANDROGYNY.

STYLE: Realistic fashion studio photograph. Neutral studio background. Natural skin texture.
BODY: Preserve ${bodySilhouette} proportions.
CLOTHING: Simple high-quality professional neutral clothing.`;

  try {
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1792" as any, 
      quality: "medium" as any,
      response_format: "b64_json"
    });

    const b64Data = response.data[0].b64_json;
    if (!b64Data) throw new Error("La IA no devolvió datos de imagen válidos.");

    // Retornamos el Data URI directamente para que el cliente lo guarde en su memoria local (IndexedDB)
    return { imageUrl: `data:image/png;base64,${b64Data}` };
  } catch (error: any) {
    console.error("Avatar Generation Error:", error);
    throw new Error(error.message || "Error al conectar con el motor de imagen.");
  }
}
