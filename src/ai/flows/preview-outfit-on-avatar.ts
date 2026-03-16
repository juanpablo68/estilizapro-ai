'use server';
/**
 * @fileOverview A Genkit flow for previewing clothing items on a user's stylized avatar.
 * 
 * This flow now uses a more robust model configuration to handle potential quota issues.
 *
 * - previewOutfitOnAvatar - A function that handles the outfit preview process.
 * - PreviewOutfitOnAvatarInput - The input type for the previewOutfitOnAvatar function.
 * - PreviewOutfitOnAvatarOutput - The return type for the previewOutfitOnAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const previewOutfitOnAvatarFlow = ai.defineFlow(
  {
    name: 'previewOutfitOnAvatarFlow',
    inputSchema: PreviewOutfitOnAvatarInputSchema,
    outputSchema: PreviewOutfitOnAvatarOutputSchema,
  },
  async (input) => {
    // We use the multimodal generation capabilities of the flash model
    const response = await ai.generate({
      // Using a slightly more reliable model for image manipulation tasks
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        { media: { url: input.avatarDataUri } },
        { media: { url: input.clothingItemDataUri } },
        { text: 'Combine the clothing item from the second image onto the person in the first image (avatar). Ensure the clothing fits naturally and the overall image is a unified, styled representation of the avatar wearing the item. Return the resulting image.' },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!response.media || !response.media.url) {
      throw new Error('No se pudo generar la vista previa del conjunto. El modelo no devolvió una imagen.');
    }

    return { previewImageDataUri: response.media.url };
  }
);

export async function previewOutfitOnAvatar(
  input: PreviewOutfitOnAvatarInput
): Promise<PreviewOutfitOnAvatarOutput> {
  return previewOutfitOnAvatarFlow(input);
}
