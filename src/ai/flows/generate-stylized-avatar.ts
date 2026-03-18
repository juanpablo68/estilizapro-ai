
'use server';
/**
 * @fileOverview Generación de Avatar Pixar utilizando OpenAI SDK directamente.
 * Se utiliza el SDK oficial para evitar conflictos de dependencias en Genkit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateStylizedAvatarInputSchema = z.object({
  visualDescription: z.string().describe('Descripción visual detallada para el avatar.'),
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

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-quality 3D animated character in Disney/Pixar style. Character features based on: ${input.visualDescription}. PURE WHITE BACKGROUND. Full body shot, cinematic lighting, vibrant colors. Professional fashion render. Masterpiece quality.`,
      n: 1,
      size: "1024x1024",
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
