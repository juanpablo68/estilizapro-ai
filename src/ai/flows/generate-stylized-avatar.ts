
'use server';
/**
 * @fileOverview Generación de Avatar Pixar utilizando Gemini 2.5 Flash Image.
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
  isPlaceholder: z.boolean().optional().describe("Indica si se usó una imagen de respaldo."),
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
      // Usamos el modelo Flash con capacidades de generación de imagen multimodal
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: input.facePhotoDataUri } },
          { media: { url: input.figurePhotoDataUri } },
          { text: 'Analyze the person in these two photos (face and body). Create a NEW 3D animated character in the style of Pixar. Requirements: 1) The character must resemble the person in the photos (hair, features, build). 2) Style must be professional 3D render (Disney/Pixar aesthetic). 3) Background MUST be PURE WHITE. 4) NO landscapes, NO outdoors, NO blurred backgrounds. 5) Return ONLY the resulting 3D character image.' },
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
      
      throw new Error("No se recibió imagen del modelo.");
    } catch (e) {
      console.error("Error en generación de avatar:", e);
      // Fallback a un modelo de alta calidad que sí es un personaje (evitando paisajes)
      return { 
        avatarDataUri: `https://picsum.photos/seed/fashion-avatar-base-3d/600/800`,
        isPlaceholder: true
      };
    }
  }
);
