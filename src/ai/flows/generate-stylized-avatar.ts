'use server';
/**
 * @fileOverview Generación de Avatar Estilizado Profesional con alta fidelidad biométrica.
 * Garantiza coincidencia de rasgos y limpieza absoluta del fondo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
});

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>): Promise<z.infer<typeof GenerateStylizedAvatarOutputSchema>> {
  return generateStylizedAvatarFlow(input);
}

const generateStylizedAvatarFlow = ai.defineFlow(
  {
    name: 'generateStylizedAvatarFlow',
    inputSchema: GenerateStylizedAvatarInputSchema,
    outputSchema: GenerateStylizedAvatarOutputSchema,
  },
  async (input) => {
    const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API Key de OpenAI requerida.");

    const openai = new OpenAI({ apiKey });
    const data = input.biometricData || {};

    const personType = data.genero || 'Femenino';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural';
    const skinTone = data.colorimetria?.tono_piel || 'light skin';
    const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';

    const finalPrompt = `A high-end professional fashion editorial photograph of ONE SINGLE ${personType}. 
    
    PHYSICAL TRAITS (MANDATORY):
    - Skin tone: ${skinTone}.
    - Hair: ${hairColor}.
    - Eyes: ${eyeColor}.
    - Style: Modern 3D stylized character with Pixar-quality lighting.
    
    COMPOSITION:
    - FULL LENGTH SHOT: The subject is fully visible from the top of the head to the bottom of their shoes. 
    - Standing centrally in a neutral, stylish fashion pose.
    - Wearing modern, minimalist fashion clothing and footwear.
    
    ENVIRONMENT & RULES:
    - THE SUBJECT IS THE ONLY FIGURE IN THE IMAGE. NO SECONDARY MODELS OR DIAGRAMS.
    - BACKGROUND: A PURE, SOLID, UNIFORM, AND EMPTY WHITE (#FFFFFF) INFINITE VOID.
    - ABSOLUTELY NO TECHNICAL LINES, NO RULERS, NO MEASUREMENTS, NO NUMBERS, NO GRIDS, NO CHARTS.
    - NO TEXT, NO HORIZON LINES, NO SYMBOLS.
    - THE IMAGE IS CLEAN, ARTISTIC, AND MINIMALIST.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
        response_format: "b64_json",
      });

      const imageData = response.data[0].b64_json;
      if (!imageData) throw new Error("Error en la generación visual.");

      return { avatarDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Error:", error);
      throw new Error(error.message || "Error al generar el avatar estilizado.");
    }
  }
);
