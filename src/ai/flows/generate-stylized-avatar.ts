'use server';
/**
 * @fileOverview A Genkit flow for generating a Pixar-like animated avatar from user photos.
 * 
 * This flow now uses a two-step process to avoid quota issues with experimental models:
 * 1. Analyzes the input photos using the standard Gemini Flash model to create a detailed description.
 * 2. Uses the Imagen model to generate the final stylized avatar from that description.
 *
 * - generateStylizedAvatar - A function that handles the avatar generation process.
 * - GenerateStylizedAvatarInput - The input type for the generateStylizedAvatar function.
 * - GenerateStylizedAvatarOutput - The return type for the generateStylizedAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  facePhotoDataUri: z
    .string()
    .describe(
      "A photo of the user's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  figurePhotoDataUri: z
    .string()
    .describe(
      "A photo of the user's full figure, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateStylizedAvatarInput = z.infer<
  typeof GenerateStylizedAvatarInputSchema
>;

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "The generated Pixar-like animated avatar image, as a data URI that includes a MIME type and uses Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateStylizedAvatarOutput = z.infer<
  typeof GenerateStylizedAvatarOutputSchema
>;

/**
 * Generates a stylized Pixar-like avatar.
 * Uses a robust 2-step process to ensure high availability and quality.
 */
export async function generateStylizedAvatar(
  input: GenerateStylizedAvatarInput
): Promise<GenerateStylizedAvatarOutput> {
  return generateStylizedAvatarFlow(input);
}

const generateStylizedAvatarFlow = ai.defineFlow(
  {
    name: 'generateStylizedAvatarFlow',
    inputSchema: GenerateStylizedAvatarInputSchema,
    outputSchema: GenerateStylizedAvatarOutputSchema,
  },
  async input => {
    // Step 1: Analyze the photos to get a detailed character description
    // We use the default gemini-2.5-flash model for this multimodal task
    const analysisResponse = await ai.generate({
      prompt: [
        { media: { url: input.facePhotoDataUri } },
        { media: { url: input.figurePhotoDataUri } },
        { text: "Analyze these photos and provide a detailed physical description for a 3D animated character avatar. Focus on: hair color/style, eye color, facial structure, skin tone, body type, and current clothing. Describe them in a way that captures their essence for a Pixar-style character. Keep the description concise but vivid." }
      ]
    });

    const characterDescription = analysisResponse.text;

    // Step 2: Generate the image using Imagen
    // This model is specifically optimized for high-quality image generation from text
    const generationResponse = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `A high-quality, professional 3D Pixar-style animated character avatar. The character should have: ${characterDescription}. Cinematic lighting, soft 3D render, vibrant colors, expressive features, Disney-inspired aesthetic, white background.`,
    });

    if (!generationResponse.media || !generationResponse.media.url) {
      throw new Error('El servicio de generación de imágenes no devolvió ningún resultado. Por favor, inténtalo de nuevo.');
    }

    return { avatarDataUri: generationResponse.media.url };
  }
);
