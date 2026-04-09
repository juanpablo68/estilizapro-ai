'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D de alta fidelidad.
 * Optimizado para cuerpo completo, género identificado y fondo blanco inmaculado.
 * ELIMINACIÓN RADICAL de líneas técnicas, mallas de alambre, círculos de medida y diagramas.
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

export type GenerateStylizedAvatarInput = z.infer<typeof GenerateStylizedAvatarInputSchema>;
export type GenerateStylizedAvatarOutput = z.infer<typeof GenerateStylizedAvatarOutputSchema>;

export async function generateStylizedAvatar(input: GenerateStylizedAvatarInput): Promise<GenerateStylizedAvatarOutput> {
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

    const g = (path: string, defaultValue = 'standard') => {
      const parts = path.split('.');
      let current: any = bio;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return defaultValue;
        }
      }
      return current || defaultValue;
    };

    const gender = bio.genero || 'Femenino';
    const skinTono = g('colorimetria.tono_piel');
    const eyeColor = g('rostro.ojos.color_detalle');
    const hairColor = g('rostro.cabello.color_natural');

    // Prompt radicalmente artístico para evitar CUALQUIER interpretación técnica
    const finalPrompt = `
      A STUNNING FULL-BODY 3D CHARACTER RENDER in the style of high-end modern animation (Disney/Pixar style). 
      This is a clean, finished fashion catalog image for a character model.
      
      COMPOSITION & FRAME:
      - FULL BODY VIEW: The character MUST be shown from head to toe. 
      - VISIBLE FEET: The entire legs and feet MUST be inside the camera frame.
      - PURE SOLID WHITE BACKGROUND: The background MUST be absolute #FFFFFF solid white. No floor lines, no shadows on the wall, no gradients, no grey, no props.
      
      CHARACTER DESIGN:
      - Gender: Clearly ${gender} anatomy and facial features.
      - Skin: Smooth ${skinTono} complexion.
      - Eyes: Clear and detailed ${eyeColor} eyes, warm friendly look.
      - Hair: Beautifully rendered ${hairColor} hair, professional digital styling.
      
      CLOTHING:
      - Wearing simple, high-quality modern lifestyle clothing: a plain premium cotton t-shirt, minimal slim-fit joggers, and clean white fashion sneakers.
      
      STRICT NEGATIVE CONSTRAINTS (FORBIDDEN):
      - NO CIRCLES, NO LINES, NO GRIDS, NO DOTS, NO CROSSHAIRS.
      - NO HUD, NO UI ELEMENTS, NO TECHNICAL INTERFACE.
      - NO DIAGRAMS, NO BLUEPRINTS, NO MEASUREMENT MARKERS.
      - NO TEXT, NO ANNOTATIONS, NO NUMBERS.
      - DO NOT DRAW ANY GEOMETRIC SHAPES AROUND THE CHARACTER.
      - The image must look like a pure artistic portrait on a white paper background.
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
      console.error("DALL-E Generation Error:", error);
      throw new Error(error.message || "Error al generar el avatar visual.");
    }
  }
);
