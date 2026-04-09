'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D Pixar de alta fidelidad.
 * Optimizado para cuerpo completo, género identificado y FONDO BLANCO PURO.
 * Eliminación total de artefactos técnicos y puntos de color.
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

    const g = (path: string, defaultValue = 'not specified') => {
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

    const gender = bio.genero || 'Feminine';
    const skinTono = g('colorimetria.tono_piel');
    const eyeColor = g('rostro.ojos.color_detalle');
    const hairColor = g('rostro.cabello.color_natural');

    // Prompt optimizado para CUERPO COMPLETO, GÉNERO CORRECTO y FONDO BLANCO PURO
    const finalPrompt = `
      HEAD-TO-TOE FULL BODY CINEMATIC SHOT of a ${gender} character in a high-quality 3D digital animation style.
      
      PHYSICAL CHARACTERISTICS:
      - Face: ${gender} features, ${eyeColor} eyes, friendly expression.
      - Skin: ${skinTono} tone.
      - Hair: ${hairColor} color.
      
      OUTFIT:
      - Wearing basic minimalist technical sports clothes: technical t-shirt, leggings/joggers, and modern sneakers.
      
      COMPOSITION & ENVIRONMENT:
      - PURE WHITE BACKGROUND. Entirely empty white studio space.
      - FULL BODY VIEW: Character's head to shoes must be completely visible.
      - NO technical dots, NO measurement points, NO color swatches on the face, NO eye color verification markers.
      - NO technical diagrams, NO blueprint lines, NO text, NO labels.
      - Clean 3D render, soft lighting, vibrant professional digital art.
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
