
'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar Estilizado.
 * Genera una única figura humana con estética de alta gama, eliminando sesgos técnicos.
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

    // Prompt puramente artístico para evitar el estilo de "plano técnico"
    const finalPrompt = `
      A CINEMATIC FULL-BODY PORTRAIT OF A SINGLE PERSON.
      ONE SINGLE CHARACTER STANDING CENTRALLY. 
      STYLE: High-end 3D character animation (Disney Pixar style), stunning artistic render, cinematic lighting, fashion magazine quality.
      CHARACTER: A ${gender} with ${eyes} eyes and ${hair} hair. ${skin} skin tone. 
      WEARING: Simple elegant modern casual clothing.
      
      COMPOSITION:
      - THE PERSON IS THE ONLY SUBJECT IN THE FRAME. 
      - FULL BODY VIEW FROM HEAD TO TOE. 
      - STANDING NORMALLY FACING FORWARD.
      - BACKGROUND: ABSOLUTE EMPTY MINIMALIST SOLID WHITE STUDIO BACKGROUND. 
      
      STRICT CONSTRAINTS:
      - NO GRIDS, NO LINES, NO RULERS, NO MEASUREMENTS.
      - NO MULTIPLE VIEWS, NO SPLIT SCREEN, NO CHARACTER SHEETS.
      - NO NUMBERS, NO SYMBOLS, NO HUD, NO TEXT.
      - NO BLUEPRINTS, NO TECHNICAL DRAWINGS.
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
