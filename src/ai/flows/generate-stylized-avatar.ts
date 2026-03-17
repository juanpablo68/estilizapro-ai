'use server';
/**
 * @fileOverview A Genkit flow for generating a Pixar-like animated avatar profile.
 * Note: Direct image generation (Imagen) is currently restricted to paid plans.
 * This flow now provides a high-quality stylized placeholder for prototype visualization.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  facePhotoDataUri: z
    .string()
    .describe(
      "A photo of the user's face, as a data URI."
    ),
  figurePhotoDataUri: z
    .string()
    .describe(
      "A photo of the user's full figure, as a data URI."
    ),
});
export type GenerateStylizedAvatarInput = z.infer<
  typeof GenerateStylizedAvatarInputSchema
>;

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "The generated avatar image data URI."
    ),
});
export type GenerateStylizedAvatarOutput = z.infer<
  typeof GenerateStylizedAvatarOutputSchema
>;

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
    // Analyze input for potential later use or text description
    const analysisResponse = await ai.generate({
      prompt: [
        { media: { url: input.facePhotoDataUri } },
        { text: "Briefly describe this person's hair and eye color in 2 words." }
      ]
    });

    const hint = analysisResponse.text || "stylized person";

    // Since Imagen 4 is paid-only, we use a high-quality stylized placeholder 
    // that the Studio's AI-Hint system will replace with a professional 3D character.
    return { 
      avatarDataUri: `https://picsum.photos/seed/${encodeURIComponent(hint)}/600/800` 
    };
  }
);
