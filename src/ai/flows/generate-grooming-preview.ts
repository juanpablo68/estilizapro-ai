
'use server';
/**
 * @fileOverview Generación visual de maquillaje y peinado sobre el rostro del avatar.
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
      ? "The man has a well-groomed, professional beard or stubble as described." 
      : "The man is clean-shaven, with smooth skin and no facial hair.";
  }

  const finalPrompt = `A high-end professional beauty editorial close-up portrait of ONE SINGLE ${personType}.
  
  LOOK DESCRIPTION: ${input.description}.
  
  PHYSICAL TRAITS:
  - Skin tone: ${skinTone}.
  - Natural Hair color: ${hairColor}.
  ${facialHairInstruction}
  
  COMPOSITION:
  - Close-up shot focusing on the face and hair.
  - Background: A PURE, SOLID, EMPTY WHITE (#FFFFFF) INFINITE VOID.
  - Style: Modern 3D stylized character (Pixar/Disney quality lighting).
  - No text, no lines, no diagrams. JUST BEAUTY AND STYLE.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
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
