
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado usando el motor moderno de OpenAI.
 * Se eliminan parámetros obsoletos para garantizar estabilidad total.
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
  if (!apiKey) throw new Error("No se detectó una API Key de OpenAI válida.");

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
    // Usamos la configuración más limpia posible para el motor moderno
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) throw new Error("No se pudo obtener la URL de la imagen.");

    // Descargamos la imagen en el servidor para convertirla a base64
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return { avatarDataUri: `data:image/png;base64,${base64}` };
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw new Error(error.message || "Error al conectar con el motor de imágenes.");
  }
}
