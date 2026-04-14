
'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar Pixar de Cuerpo Completo.
 * Asegura una ÚNICA figura humana, de pie, con fondo blanco puro y CERO ruidos técnicos.
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

    // Prompt rediseñado para ser puramente artístico y evitar interpretaciones técnicas
    const finalPrompt = `
      A BEAUTIFUL 3D CHARACTER POSTER OF ONE SINGLE PERSON.
      STYLE: High-end modern 3D character animation (Disney Pixar style), stunning artistic render, cinematic lighting.
      CHARACTER: A ${gender} with ${eyes} eyes and ${hair} hair. ${skin} skin tone.
      
      COMPOSITION REQUIREMENTS:
      - ONLY ONE PERSON: One single character must be the only subject. NO duplicates, NO multiple poses, NO side views.
      - POSITION: Standing upright on their feet, facing forward.
      - FULL BODY: From head to toe. Shoes must be visible and stylish.
      - BACKGROUND: Absolute solid #FFFFFF plain white background. No floor lines, no grids, no shadows on the wall, no horizon line.
      
      STRICT NEGATIVE CONSTRAINTS (FORBIDDEN):
      - NO RULERS, NO MEASUREMENTS, NO NUMBERS, NO SYMBOLS.
      - NO TECHNICAL DRAWINGS, NO BLUEPRINTS, NO WIREFRAMES.
      - NO CHARACTER SHEETS, NO COLLAGES, NO TRIPTYCHS.
      - NO CIRCLES OR SCAN LINES AROUND THE BODY.
      - NO TEXT, NO LABELS, NO HUD.
      - NO BORDERS OR MARGINS.
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
