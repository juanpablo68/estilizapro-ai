'use server';
/**
 * @fileOverview Generación de Avatar Pixar de alta fidelidad utilizando DALL-E 3.
 * Optimizado para realismo cinematográfico 3D y fidelidad a los rasgos reales analizados.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateStylizedAvatarInputSchema = z.object({
  visualDescription: z.string().describe('Descripción visual detallada extraída de las fotos reales.'),
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
    
    if (!apiKey) {
      throw new Error("No se encontró la API Key de OpenAI. Configúrala en Ajustes.");
    }

    const openai = new OpenAI({ apiKey });

    // Prompt optimizado para realismo 3D cinematográfico Pixar
    const finalPrompt = `A stunning, high-fidelity 3D animated character in the modern Disney/Pixar cinematic style (like "Turning Red" or "Inside Out 2"). 
    CHARACTER FEATURES (BASED ONLY ON REFERENCE): ${input.visualDescription}. 
    ARTISTIC DIRECTION: Professional 3D render, realistic skin subsurface scattering, incredibly expressive and detailed eye reflections, individual hair strand simulation, vibrant but natural cinematic colors. 
    COMPOSITION: Medium-full body shot, confident and fashionable pose. 
    LIGHTING: Three-point studio lighting with a soft rim light for depth. 
    ENVIRONMENT: Solid minimalist light grey background. 
    QUALITY: 8k resolution, photorealistic textures for fabric and skin, masterpiece fashion aesthetic.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json",
    });

    const imageData = response.data[0].b64_json;
    if (!imageData) {
      throw new Error("Error al recibir la imagen de OpenAI.");
    }

    return {
      avatarDataUri: `data:image/png;base64,${imageData}`
    };
  }
);
