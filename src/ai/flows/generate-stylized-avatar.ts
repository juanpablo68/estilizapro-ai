'use server';
/**
 * @fileOverview Generación de Avatar Pixar utilizando Gemini 2.0 Flash.
 * Aprovecha las capacidades multimodales para transformar fotos reales en personajes 3D.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  facePhotoDataUri: z
    .string()
    .describe(
      "Foto del rostro del usuario en formato data URI."
    ),
  figurePhotoDataUri: z
    .string()
    .describe(
      "Foto del cuerpo completo del usuario en formato data URI."
    ),
});
export type GenerateStylizedAvatarInput = z.infer<
  typeof GenerateStylizedAvatarInputSchema
>;

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "Data URI de la imagen del avatar generado."
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
    // Usamos Gemini 2.0 Flash con salida multimodal de imagen
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        { media: { url: input.facePhotoDataUri } },
        { media: { url: input.figurePhotoDataUri } },
        { text: 'Create a NEW 3D animated character in the style of Pixar based on the person in these two photos. Requirements: 1) The character must resemble the person in the photos (hair color, hair style, facial features, and body build). 2) Style must be professional 3D render (Disney/Pixar aesthetic). 3) Background MUST be PURE WHITE. 4) Return ONLY the resulting 3D character image.' },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (response.media && response.media.url) {
      return { 
        avatarDataUri: response.media.url
      };
    }
    
    throw new Error("El modelo no generó una imagen. Asegúrate de que tu API Key de Google AI Studio sea de pago y tenga habilitada la generación multimodal.");
  }
);
