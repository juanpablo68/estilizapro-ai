'use server';
/**
 * @fileOverview Preview clothing on avatar using OpenAI Vision.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PreviewOutfitOnAvatarInputSchema = z.object({
  avatarDataUri: z.string(),
  clothingItemDataUri: z.string(),
});

const PreviewOutfitOnAvatarOutputSchema = z.object({
  previewImageDataUri: z.string(),
});

export async function previewOutfitOnAvatar(input: any) {
  const response = await ai.generate({
    model: 'openai/gpt-4o',
    prompt: [
      { media: { url: input.avatarDataUri } },
      { media: { url: input.clothingItemDataUri } },
      { text: 'Synthesize the clothing item from the second image onto the avatar in the first image. Return only the final styled image.' },
    ],
    config: {
      // Note: OpenAI handling of image output via generate might vary by plugin version.
      // We assume the plugin supports returning the media URL if DALLE-3 or vision model is configured.
    }
  });

  if (response.media?.url) {
    return { previewImageDataUri: response.media.url };
  }

  throw new Error('Error al generar la vista previa del conjunto con OpenAI.');
}
