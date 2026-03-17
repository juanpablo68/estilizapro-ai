'use server';
/**
 * @fileOverview Generación de Avatar Pixar utilizando exclusivamente OpenAI (GPT-4o + DALL-E 3).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  facePhotoDataUri: z.string(),
  figurePhotoDataUri: z.string(),
  openaiApiKey: z.string().optional(),
});

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string(),
});

export async function generateStylizedAvatar(input: any) {
  if (input.openaiApiKey) {
    process.env.OPENAI_API_KEY = input.openaiApiKey;
  }

  // Análisis con GPT-4o
  const analysisResponse = await ai.generate({
    model: 'openai/gpt-4o',
    prompt: [
      { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
      { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
      { text: 'Analyze these photos. Describe the person for a 3D Pixar artist: hair style, face shape, eye color, and build. Be concise.' },
    ],
  });

  const description = analysisResponse.text;

  // Generación con DALL-E 3
  const generationResponse = await ai.generate({
    model: 'openai/dall-e-3',
    prompt: `A high-quality 3D animated character in Disney/Pixar style. Character features: ${description}. PURE WHITE BACKGROUND. Full body shot, cinematic lighting.`,
  });

  if (generationResponse.media?.url) {
    return { avatarDataUri: generationResponse.media.url };
  }
  
  throw new Error("No se pudo generar el avatar con OpenAI. Revisa tus créditos.");
}
