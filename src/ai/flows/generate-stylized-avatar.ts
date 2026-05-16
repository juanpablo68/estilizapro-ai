
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado usando el motor gpt-image-2.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("No se detectó una API Key de OpenAI válida. (Error 401)");
  }

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const skinTone = data.colorimetria?.tono_piel || 'light skin';

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
      response_format: "b64_json",
    });

    const b64Data = response.data[0].b64_json;
    
    if (!b64Data) {
      console.error("Respuesta completa de OpenAI sin b64_json:", JSON.stringify(response, null, 2));
      throw new Error("La IA no devolvió los datos de imagen (b64_json).");
    }

    // Devolvemos el Data URI para mantener compatibilidad con el frontend actual
    return { avatarDataUri: `data:image/png;base64,${b64Data}` };
  } catch (error: any) {
    console.error("Image Generation Error (gpt-image-2):", error);
    
    // Manejo de errores específicos solicitado
    if (error.status === 401) throw new Error("Llave de API de OpenAI inválida o mal configurada (401).");
    if (error.status === 403) throw new Error("El proyecto no tiene acceso al modelo gpt-image-2 o falta autorización (403).");
    if (error.status === 404) throw new Error("Modelo gpt-image-2 no disponible o nombre incorrecto (404).");
    if (error.status === 429) throw new Error("Límite de uso, cuota o crédito insuficiente en OpenAI (429).");
    
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
