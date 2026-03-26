'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D Pixar de alta fidelidad utilizando DALL-E 3.
 * Optimizado para encuadre de cuerpo completo (head-to-toe) y eliminación de artefactos técnicos.
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

    // Función de ayuda para evitar errores de 'undefined'
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

    // Construcción del prompt maestro optimizado para CUERPO COMPLETO y ESTILO LIMPIO
    const finalPrompt = `
      HEAD-TO-TOE FULL BODY CINEMATIC SHOT of a Disney/Pixar style 3D character standing in a neutral pose.
      
      PHYSICAL DESCRIPTION:
      - Character Gender: ${g('genero')}
      - Hair: ${g('cabello.color')}, ${g('cabello.tipo')} texture, ${g('cabello.peinado')} style.
      - Face: ${g('rostro.ojos.color')} eyes, friendly expression, ${g('tono_piel.categoria')} skin tone.
      - Body: ${g('cuerpo.complexion')} build, realistic height and proportions.
      
      OUTFIT:
      - Wearing minimalist minimalist athletic sports clothes: a plain technical t-shirt, leggings or joggers, and clean modern sneakers.
      - The entire outfit from head to shoes must be completely visible within the frame.
      
      COMPOSITION & STYLE:
      - FULL BODY VIEW: The character's head must be at the top of the frame and their feet must be clearly visible at the bottom.
      - Character is standing centered, facing the camera on a simple clean studio floor.
      - NO technical lines, NO diagrams, NO blueprint markers, NO measurement text, NO grids.
      - Professional digital 3D animation art style, vibrant colors, clean soft textures.
      - Soft studio lighting with a clean bokeh background.
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
      if (error.status === 400) {
        throw new Error("El motor de IA bloqueó la descripción por seguridad. Intenta con fotos más claras o menos sombras.");
      }
      throw error;
    }
  }
);
