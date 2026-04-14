
'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar Pixar de Cuerpo Completo.
 * Asegura una única figura humana, de pie, con fondo blanco puro y CERO ruidos técnicos.
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
    const bio = input.biometricData || {};

    const gender = bio.genero || 'Femenino';
    const skin = bio.colorimetria?.tono_piel || 'natural skin tone';
    const eyes = bio.rostro?.ojos?.color_detalle || 'natural eyes';
    const hair = bio.rostro?.cabello?.color_natural || 'natural hair';

    // Prompt refinado para evitar cualquier interpretación técnica por parte de la IA
    const finalPrompt = `
      A SINGLE STUNNING FULL-LENGTH LIFESTYLE PORTRAIT OF ONE PERSON.
      STYLE: High-end modern 3D character animation (Disney/Pixar style), clean artistic finished render.
      CHARACTER: A ${gender} with ${eyes} eyes and ${hair} hair. ${skin} skin tone.
      COMPOSITION:
      - SINGLE FIGURE: Only one character must be visible in the entire image.
      - STANDING POSITION: The character must be standing upright on their feet.
      - FULL BODY SHOT: From the very top of the head down to the tips of the shoes. Every part of the person must be visible within the frame.
      - NO CROPPING: Leave space around the head and feet.
      - PURE SOLID WHITE BACKGROUND: Background must be absolute plain #FFFFFF white. No shadows on the background, no floor textures, no floor lines.
      - VESTIMENTA: Wearing clean modern casual clothing and shoes.
      
      STRICT NEGATIVE CONSTRAINTS (FORBIDDEN ELEMENTS):
      - NO RULERS, NO MEASUREMENT LINES, NO NUMBERS, NO DIMENSIONS.
      - NO TECHNICAL DRAWINGS, NO BLUEPRINTS, NO SCHEMATICS, NO WIREFRAMES.
      - NO GRIDS, NO FLOOR GRIDS, NO HUD, NO SCAN LINES.
      - NO ANATOMICAL LABELS, NO TEXT, NO SYMBOLS.
      - NO SITTING, NO MULTIPLE VIEWS, NO SPLIT SCREEN.
      - NO CIRCLES OR DOTS around the body.
      - The image must look like a beautiful character poster on a white page, NOT a technical analysis.
    `;

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

      return {
        avatarDataUri: `data:image/png;base64,${imageData}`
      };
    } catch (error: any) {
      console.error("DALL-E Error:", error);
      throw new Error(error.message || "Error al generar el avatar visual.");
    }
  }
);
