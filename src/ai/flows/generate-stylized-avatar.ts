'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar.
 * ELIMINACIÓN RADICAL de cualquier lenguaje técnico para evitar líneas HUD, círculos y diagramas.
 * Se enfoca en un renderizado de personaje Disney/Pixar limpio sobre fondo blanco puro.
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

    // Mapeo simple de etiquetas para evitar palabras técnicas que confunden a DALL-E
    const gender = bio.genero || 'Femenino';
    const skin = bio.colorimetria?.tono_piel || 'clear';
    const eyes = bio.rostro?.ojos?.color_detalle || 'natural';
    const hair = bio.rostro?.cabello?.color_natural || 'natural';

    const finalPrompt = `
      A STUNNING SINGLE-CHARACTER LIFESTYLE PORTRAIT in the style of high-end modern 3D animation (Disney/Pixar style).
      
      COMPOSITION:
      - SINGLE FIGURE: Only one character in the frame.
      - FULL BODY VIEW: Shown from head to toe, with feet fully visible and inside the frame.
      - PURE SOLID WHITE BACKGROUND: Absolute #FFFFFF paper-white background. No shadows, no floor lines, no gradients, no grey spots.
      
      CHARACTER DETAILS:
      - Gender: Clearly ${gender} anatomy and facial features.
      - Features: Beautifully rendered ${eyes} eyes and ${hair} hair.
      - Skin: Smooth ${skin} skin texture.
      - Clothing: Wearing simple, elegant modern casual clothes (plain t-shirt and minimal trousers).
      
      STRICT NEGATIVE CONSTRAINTS (FORBIDDEN):
      - NO HUD, NO INTERFACE, NO UI.
      - NO CIRCLES, NO LINES, NO GRIDS, NO MEASUREMENTS.
      - NO DIAGRAMS, NO BLUEPRINTS, NO TECHNICAL DRAWINGS.
      - NO TEXT, NO NUMBERS, NO ANNOTATIONS.
      - NO MULTIPLE VIEWS: Only one character looking forward.
      - NO WIREFRAMES, NO 3D MESH LINES.
      - The image must look like a finished artistic character model on a plain white page.
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
