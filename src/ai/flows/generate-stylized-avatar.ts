
'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar.
 * Eliminación total de estética de ingeniería y diagramas técnicos.
 * Enfoque en avatar de cuerpo completo, DE PIE y con fondo blanco puro.
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

    // Prompt puramente artístico de alta gama. 
    // Se elimina cualquier palabra técnica (biometría, análisis) para evitar diagramas.
    const finalPrompt = `
      A STUNNING FULL-LENGTH LIFESTYLE PORTRAIT OF A CHARACTER.
      STYLE: High-end modern 3D animation (Disney/Pixar style), clean artistic render.
      CHARACTER: A ${gender} with ${eyes} eyes and ${hair} hair. ${skin} skin tone.
      COMPOSITION:
      - STANDING UPRIGHT: The character must be standing on their feet, not sitting, not crouching.
      - FULL BODY VIEW: Head-to-toe shot. Every part of the body from the top of the head to the soles of the shoes must be visible within the frame.
      - WIDE ANGLE: Ensure there is breathing room around the character so nothing is cropped.
      - CLOTHING: Wearing elegant modern casual clothing AND SHOES. 
      - PURE SOLID WHITE BACKGROUND: Absolute #FFFFFF paper-white background. No floor lines, no grid patterns, no shadows on walls, no floor texture, no diagrams.
      
      STRICT NEGATIVE CONSTRAINTS (FORBIDDEN):
      - NO WIREFRAMES, NO GRID LINES, NO FLOOR GRIDS, NO BLUEPRINTS.
      - NO MEASUREMENT LINES, NO DOTS, NO CIRCLES, NO HUD.
      - NO TECHNICAL DRAWINGS, NO ANATOMICAL DIAGRAMS, NO LABELS, NO TEXT.
      - NO SITTING: The character MUST NOT be sitting.
      - NO BAREFOOT: The character MUST be wearing shoes.
      - The image must look like a clean finished artistic render of a real person in Pixar style on a plain white page.
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
