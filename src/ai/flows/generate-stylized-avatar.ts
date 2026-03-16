'use server';
/**
 * @fileOverview A Genkit flow for generating a Pixar-like animated avatar from user photos.
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

export async function generateStylizedAvatar(
  input: GenerateStylizedAvatarInput
): Promise<GenerateStylizedAvatarOutput> {
  return generateStylizedAvatarFlow(input);
}

const generateStylizedAvatarPrompt = ai.definePrompt({
  name: 'generateStylizedAvatarPrompt',
  input: {schema: GenerateStylizedAvatarInputSchema},
  output: {schema: GenerateStylizedAvatarOutputSchema},
  prompt: `Based on the provided face and full figure images, generate a unique, Pixar-like animated avatar. The avatar should capture the likeness of the person in the photos but in a distinct animated style. Ensure the output is a single image representing the full avatar.

Face Photo: {{media url=facePhotoDataUri}}
Figure Photo: {{media url=figurePhotoDataUri}}`,
});

const generateStylizedAvatarFlow = ai.defineFlow(
  {
    name: 'generateStylizedAvatarFlow',
    inputSchema: GenerateStylizedAvatarInputSchema,
    outputSchema: GenerateStylizedAvatarOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: [
        {media: {url: input.facePhotoDataUri}},
        {media: {url: input.figurePhotoDataUri}},
        {text: `Based on these photos, create a unique, Pixar-like animated avatar. The avatar should capture the likeness of the person in the photos but in a distinct animated style. Focus on generating a full-body avatar.`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!output || !output.media || output.media.length === 0) {
      throw new Error('Failed to generate avatar image.');
    }

    const avatarDataUri = output.media[0].url;

    return {avatarDataUri};
  }
);
