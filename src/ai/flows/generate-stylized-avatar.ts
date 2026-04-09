'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D de alta fidelidad.
 * Optimizado para cuerpo completo, género identificado y fondo blanco inmaculado.
 * ELIMINACIÓN TOTAL de líneas técnicas, mallas de alambre y diagramas.
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

    const gender = bio.genero || 'Femenino';
    const skinTono = g('colorimetria.tono_piel');
    const eyeColor = g('rostro.ojos.color_detalle');
    const hairColor = g('rostro.cabello.color_natural');

    // Prompt rediseñado para ser puramente artístico y evitar CUALQUIER elemento técnico
    const finalPrompt = `
      A HIGH-QUALITY 3D DIGITAL CHARACTER RENDER in the style of modern animated films. 
      This is a finished cinematic character model, NOT a technical drawing.
      
      COMPOSITION:
      - FULL BODY STANDING POSE.
      - HEAD-TO-TOE SHOT: The entire character from head to feet MUST be completely visible inside the frame.
      - PURE SOLID WHITE BACKGROUND (#FFFFFF). No shadows, no floor, no props, no gradients.
      
      PHYSICAL CHARACTERISTICS:
      - Gender: Clearly ${gender} facial features and body anatomy.
      - Eyes: Realistic ${eyeColor} eyes, soft friendly expression.
      - Skin: Smooth ${skinTono} skin tone.
      - Hair: Stylized ${hairColor} hair with professional digital grooming.
      
      OUTFIT:
      - Wearing simple modern minimalist lifestyle clothing: a plain cotton t-shirt, casual joggers, and clean modern sneakers.
      
      STRICT PROHIBITIONS (DO NOT INCLUDE):
      - NO technical lines, NO grid lines, NO wireframes, NO measurement markers.
      - NO blueprint elements, NO CAD diagrams, NO anatomical labels.
      - NO text, NO numbers, NO circles around the eyes, NO crosshairs.
      - The character MUST NOT have any white or glowing lines drawn on their body or clothes.
      - The image must look like a clean, finished 3D illustration.
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
