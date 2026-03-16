'use server';
/**
 * @fileOverview A Genkit flow for previewing clothing items on a user's stylized avatar.
 *
 * - previewOutfitOnAvatar - A function that handles the outfit preview process.
 * - PreviewOutfitOnAvatarInput - The input type for the previewOutfitOnAvatar function.
 * - PreviewOutfitOnAvatarOutput - The return type for the previewOutfitOnAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "A data URI of the user's stylized avatar. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  clothingItemDataUri: z
    .string()
    .describe(
      "A data URI of the clothing item to preview. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PreviewOutfitOnAvatarInput = z.infer<
  typeof PreviewOutfitOnAvatarInputSchema
>;

const PreviewOutfitOnAvatarOutputSchema = z.object({
  previewImageDataUri: z
    .string()
    .describe(
      "A data URI of the avatar wearing the clothing item. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PreviewOutfitOnAvatarOutput = z.infer<
  typeof PreviewOutfitOnAvatarOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'previewOutfitOnAvatarPrompt',
  input: {schema: PreviewOutfitOnAvatarInputSchema},
  output: {schema: PreviewOutfitOnAvatarOutputSchema},
  model: googleAI.model('gemini-2.5-flash-image'),
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  prompt: [
    {media: {url: '{{{avatarDataUri}}}'}},
    {media: {url: '{{{clothingItemDataUri}}}'}},
    {
      text:
        'Combine the clothing item from the second image onto the person in the first image (avatar). Ensure the clothing fits naturally and the overall image is a unified, styled representation of the avatar wearing the item.',
    },
  ],
});

const previewOutfitOnAvatarFlow = ai.defineFlow(
  {
    name: 'previewOutfitOnAvatarFlow',
    inputSchema: PreviewOutfitOnAvatarInputSchema,
    outputSchema: PreviewOutfitOnAvatarOutputSchema,
  },
  async (input) => {
    const {media} = await prompt(input);
    if (!media || !media.url) {
      throw new Error('Failed to generate preview image: No media returned.');
    }
    return {previewImageDataUri: media.url};
  }
);

export async function previewOutfitOnAvatar(
  input: PreviewOutfitOnAvatarInput
): Promise<PreviewOutfitOnAvatarOutput> {
  return previewOutfitOnAvatarFlow(input);
}
