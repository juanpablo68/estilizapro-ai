
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado usando DALL-E 3 (Configuración ultra-estable).
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
});

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>): Promise<z.infer<typeof GenerateStylizedAvatarOutputSchema>> {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const skinTone = data.colorimetria?.tono_piel || 'light skin';

  const finalPrompt = `A high-end professional fashion portrait of ONE SINGLE ${personType}. 
  FEATURES: ${skinTone} skin, ${hairColor} hair.
  STYLE: Modern 3D stylized character design, high-end studio lighting. 
  COMPOSITION: Full length body shot, standing centrally, neutral pose, minimalist clothes.
  ENVIRONMENT: Solid pure white background.`;

  try {
    // Llamada simplificada sin parámetros conflictivos
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) throw new Error("No se recibió la URL de la imagen.");

    // Convertir a base64 en el servidor para mayor estabilidad
    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    return { avatarDataUri: base64 };
  } catch (error: any) {
    console.error("DALL-E Avatar Error:", error);
    throw new Error("Error al generar el avatar con el motor de imágenes.");
  }
}
