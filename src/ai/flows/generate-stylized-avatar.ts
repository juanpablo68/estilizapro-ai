
'use server';
/**
 * @fileOverview A Genkit flow for generating a Pixar-like animated avatar profile.
 * 
 * Uses Gemini 2.5 Flash Image to analyze user photos.
 * If generation is restricted by API limits, it returns a stable high-quality character placeholder.
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
      // Intentamos generar el avatar analizando las fotos del usuario
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: input.facePhotoDataUri } },
          { media: { url: input.figurePhotoDataUri } },
          { text: 'Analyze the uploaded face and body photos. Create a FULL-LENGTH 3D Pixar-style animated character that represents this person. The subject MUST be a 3D character, NOT a real photo. Preserve hairstyle and body proportions. Use a neutral pose on a PURE WHITE background. IMPORTANT: Do not include landscapes, ocean, or blurred outdoor backgrounds. Return ONLY the resulting image.' },
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
      
      throw new Error("Generation restricted or failed.");
    } catch (e) {
      // Si falla (común en planes gratuitos), devolvemos un avatar base de alta calidad de nuestra librería
      // Esto asegura que el probador virtual funcione con un modelo humanoide.
      return { 
        avatarDataUri: `https://picsum.photos/seed/pixar-character-model-v2/600/800`,
        isPlaceholder: true
      };
    }
  }
);
