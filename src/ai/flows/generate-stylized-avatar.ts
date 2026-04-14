'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar Estilizado.
 * Genera una única figura humana con estética de alta gama.
 * Garantiza una toma de cuerpo completo de cabeza a pies sobre fondo blanco inmaculado.
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

    // Prompt optimizado: Se eliminan menciones a "medidas" o "técnico" para evitar que la IA las dibuje
    const finalPrompt = `
      A professional full-length standing fashion shot of one single person. 
      The image captures the entire body from the top of the head to the bottom of the shoes. 
      The person is standing centrally facing the camera.
      Style: High-end 3D animation (Pixar-inspired), cinematic lighting, clean vibrant colors. 
      The person is a ${gender} with ${eyes} eyes and ${hair} hair, having a ${skin} skin tone. 
      
      COMPOSITION:
      - THE ENTIRE FRAME IS FILLED ONLY BY THE PERSON AND A PURE WHITE VOID.
      - THE BACKGROUND IS COMPLETELY EMPTY, SOLID, AND PURE WHITE (#FFFFFF).
      - NO TEXT, NO LINES, NO ICONS, NO NUMBERS, NO SYMBOLS.
      - NO GRIDS, NO MEASUREMENTS, NO TECHNICAL DRAWINGS.
      - ONLY ONE SINGLE PERSON IS VISIBLE.
      - THE PERSON MUST BE FULLY VISIBLE FROM HEAD TO TOE, INCLUDING SHOES.
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
