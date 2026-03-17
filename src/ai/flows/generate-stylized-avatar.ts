'use server';
/**
 * @fileOverview A Genkit flow for generating a Pixar-like animated avatar profile.
 * 
 * Uses Gemini 2.5 Flash Image to analyze the user's face and figure photos 
 * to generate a stylized 3D representation.
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
  isPlaceholder: z.boolean().optional().describe("Whether the image is a fallback placeholder."),
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
    try {
      // Use the multimodal capabilities to generate a stylized avatar based on user photos
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: input.facePhotoDataUri } },
          { media: { url: input.figurePhotoDataUri } },
          { text: 'Analyze these photos and generate a 3D Pixar-style animated character avatar. The character MUST resemble the person in the photos, maintaining their hair style, facial structure, and body proportions. The style should be smooth 3D animation, like a character from a modern animated movie. Return only the resulting image.' },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (response.media && response.media.url) {
        return { 
          avatarDataUri: response.media.url,
          isPlaceholder: false
        };
      }
      
      throw new Error("Model did not return media.");
    } catch (e) {
      console.error("Image-to-Image generation failed, using stylized character fallback:", e);
      // Fallback to a seed that is known to produce a human-like 3D character 
      // instead of a generic building or landscape.
      return { 
        avatarDataUri: `https://picsum.photos/seed/3d-character-mannequin-v2/600/800`,
        isPlaceholder: true
      };
    }
  }
);
