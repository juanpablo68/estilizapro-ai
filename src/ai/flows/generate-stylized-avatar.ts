'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar.
 * Eliminación de cualquier término técnico para evitar ruido visual (HUD, líneas, círculos).
 * Enfoque en fondo blanco puro y cuerpo completo (Pies a cabeza).
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

    // Prompt puramente artístico de alta gama con enfoque estricto en cuerpo completo
    const finalPrompt = `
      A STUNNING SINGLE-CHARACTER LIFESTYLE PORTRAIT. 
      STYLE: High-end modern 3D animation (Disney/Pixar style). 
      CHARACTER: A beautiful ${gender} with ${eyes} eyes and ${hair} hair. ${skin} skin tone. 
      COMPOSITION: 
      - FULL BODY VIEW: Head to toe, feet must be fully visible and inside the frame. Show the entire person from the top of the head to the soles of their shoes.
      - WIDE ANGLE SHOT: Ensure there is space around the character so no part of the body is cropped.
      - PURE SOLID WHITE BACKGROUND: Absolute #FFFFFF paper-white background. No floor lines, no gradients, no shadows on walls, no grey spots. 
      - CLOTHING: Wearing simple elegant modern casual clothing.
      
      FORBIDDEN (STRICT NEGATIVE CONSTRAINTS):
      - NO HUD, NO INTERFACE, NO UI ELEMENTS.
      - NO CIRCLES, NO LINES, NO GRIDS, NO MEASUREMENTS.
      - NO DIAGRAMS, NO BLUEPRINTS, NO TECHNICAL DRAWINGS.
      - NO TEXT, NO NUMBERS, NO ANNOTATIONS.
      - NO MULTIPLE VIEWS OR MULTIPLE IMAGES: ONLY ONE CHARACTER.
      - NO WIREFRAMES, NO MESH.
      - The image must look like a clean finished artistic render on a plain white page.
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
