
'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar Estilizado.
 * Genera una única figura humana con estética de alta gama, eliminando sesgos técnicos.
 * Garantiza una toma de cuerpo completo de cabeza a pies.
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

    // Prompt rediseñado para garantizar cuerpo completo sin recortes
    const finalPrompt = `
      A STUNNING FULL-LENGTH STANDING SHOT OF ONE SINGLE PERSON. 
      THE IMAGE MUST SHOW THE ENTIRE PERSON FROM THE TOP OF THEIR HEAD TO THE VERY BOTTOM OF THEIR SHOES.
      THE SUBJECT IS STANDING CENTRALLY FACING THE CAMERA IN A FULL HEIGHT VIEW.
      STYLE: High-end 3D character animation (Disney Pixar style), cinematic lighting, vibrant artistic render.
      CHARACTER: A ${gender} with ${eyes} eyes and ${hair} hair. ${skin} skin tone.
      BACKGROUND: ABSOLUTELY PLAIN SOLID EMPTY WHITE STUDIO BACKGROUND (#FFFFFF). 

      STRICT CONSTRAINTS:
      - THE PERSON MUST BE FULLY VISIBLE IN THE FRAME. DO NOT CROP THE FEET OR THE HEAD.
      - ONLY ONE PERSON IN THE IMAGE. NO OTHER FIGURES IN THE BACKGROUND.
      - NO GRIDS, NO LINES, NO RULERS, NO MEASUREMENTS.
      - NO NUMBERS, NO SYMBOLS, NO HUD, NO TEXT.
      - NO MULTIPLE VIEWS, NO CHARACTER SHEETS, NO SPLIT SCREENS.
      - NO BLUEPRINTS, NO TECHNICAL DRAWINGS.
      - NO OTHER PEOPLE OR MANNEQUINS IN THE BACKGROUND.
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
