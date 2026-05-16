'use server';
/**
 * @fileOverview Generación visual de maquillaje y peinado.
 * Versión optimizada sin parámetros incompatibles.
 */

import { ai, getOpenAIKey } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateGroomingPreviewInputSchema = z.object({
  description: z.string(),
  biometricData: z.any(),
  hasBeard: z.boolean().optional(),
  openaiApiKey: z.string().optional(),
});

export async function generateGroomingPreview(input: z.infer<typeof GenerateGroomingPreviewInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};

  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const skinTone = data.colorimetria?.tono_piel || 'light skin';
  const hasBeard = input.hasBeard || false;

  let facialHairInstruction = "";
  if (personType === 'Masculino') {
    facialHairInstruction = hasBeard 
      ? "The man has a well-groomed beard." 
      : "The man is clean-shaven.";
  }

  const finalPrompt = `Professional beauty editorial close-up portrait of ONE ${personType}.
  LOOK: ${input.description}.
  TRAITS: Skin ${skinTone}, Hair ${hairColor}. ${facialHairInstruction}
  STYLE: Modern 3D stylized character, Pixar lighting.
  BACKGROUND: Pure solid white background. No text.`;

  try {
    // Se elimina el parámetro 'style' para evitar error 400
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const imageData = response.data[0].b64_json;
    if (!imageData) throw new Error("Error en la generación visual.");

    return { previewImageDataUri: `data:image/png;base64,${imageData}` };
  } catch (error: any) {
    console.error("DALL-E Error:", error);
    throw new Error(error.message || "Error al generar la vista previa estética.");
  }
}
