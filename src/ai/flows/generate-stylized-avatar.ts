
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
      // Step 1: Analyze and Generate using the specialized image model
      // We pass both photos to ensure the model captures the full essence of the user
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: input.facePhotoDataUri } },
          { media: { url: input.figurePhotoDataUri } },
          { text: 'Act as a professional 3D character designer. Analyze the uploaded face and body photos. Create a FULL-LENGTH 3D Pixar-style character that is an exact stylized version of the person. CRITICAL: The subject MUST be a 3D animated human character. Preserve the hairstyle, hair color, and body shape. Place the character standing in a neutral pose on a simple white studio background. DO NOT return a landscape or blurred background; the focus must be 100% on the animated character subject. Return ONLY the resulting image.' },
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
      console.error("Image-to-Image generation failed, using optimized character fallback:", e);
      // Fallback to a high-quality character seed that is neutral and fits the fashion theme
      return { 
        avatarDataUri: `https://picsum.photos/seed/pixar-avatar-character-v9/600/800`,
        isPlaceholder: true
      };
    }
  }
);
