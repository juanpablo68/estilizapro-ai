
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
    const data = input.biometricData || {};

    const personType = data.genero || 'Femenino';
    const skinTone = data.colorimetria?.tono_piel || 'natural';
    const eyeColor = data.rostro?.ojos?.color_detalle || 'natural';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural';

    // Prompt rediseñado: Lenguaje fotográfico puro para evitar diagramas técnicos.
    // Se usa "Wide shot" y "Empty white space" para forzar el cuerpo completo sin recortes.
    const finalPrompt = `A high-end professional wide-shot fashion photograph of one single ${personType}. 
    The image is a full-length shot, showing the entire body clearly from the very top of the head to the very bottom of the shoes. 
    The person is standing centrally, facing forward in a clean studio.
    
    AESTHETIC: High-end 3D animated style (clean, vibrant, cinematic). The person has ${eyeColor} eyes, ${hairColor} hair, and ${skinTone} skin.
    
    COMPOSITION: 
    - THE SUBJECT IS CENTERED WITH PLENTY OF EMPTY WHITE SPACE AROUND THEM TO ENSURE THE FULL BODY IS VISIBLE WITHOUT CLIPPING.
    - THE BACKGROUND IS A SOLID, PLAIN, EMPTY, PURE WHITE (#FFFFFF) STUDIO WALL.
    - ABSOLUTELY NO OTHER ELEMENTS IN THE FRAME. 
    - NO TEXT, NO LINES, NO SYMBOLS, NO NUMBERS, NO GRID, NO MEASUREMENTS.
    - NO SECONDARY FIGURES, NO MINIATURE MODELS, NO MULTIPLE VIEWS.
    - JUST ONE SINGLE PERSON STANDING IN A PURE WHITE VOID.`;

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
