'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D Pixar de alta fidelidad utilizando DALL-E 3.
 * Modificado para evitar bloqueos por filtros de contenido y asegurar cuerpo completo.
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

    // Función de ayuda para evitar errores de 'undefined' durante la construcción del prompt
    const g = (path: string, defaultValue = 'no especificado') => {
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

    // Construcción del prompt maestro optimizado para pasar filtros de seguridad
    const finalPrompt = `
      3D Pixar-style animated character, high-quality cinematic render.
      GENDER: ${g('genero')}.
      APPEARANCE: ${g('cabello.color')} ${g('cabello.tipo')} hair, ${g('rostro.ojos.color')} eyes, skin tone category ${g('tono_piel.categoria')}.
      BODY: ${g('cuerpo.complexion')} build, realistic proportions.
      OUTFIT: Neutral-colored minimalist athletic sportswear (leggings and technical t-shirt), simple and professional.
      
      CAMERA & SHOT:
      - FULL BODY SHOT (Feet to head visible).
      - Character standing in a natural neutral pose, facing the camera.
      - The entire figure including shoes and legs MUST be in the frame.
      - Soft studio lighting, 50mm lens.
      - Clean soft-focus background (bokeh).
      
      ART STYLE:
      - Disney/Pixar 3D animation style.
      - Clean textures, professional digital art, vibrant colors.
      - NO realistic human photography. NO suggestive content.
    `;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "b64_json",
      });

      const imageData = response.data[0].b64_json;
      if (!imageData) throw new Error("Error en la generación visual.");

      return {
        avatarDataUri: `data:image/png;base64,${imageData}`
      };
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error("El motor de IA bloqueó la descripción por seguridad. Intenta con fotos más claras o ropa menos ajustada.");
      }
      throw error;
    }
  }
);
