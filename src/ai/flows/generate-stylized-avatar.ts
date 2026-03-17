
'use server';
/**
 * @fileOverview Generación de Avatar Pixar utilizando IA (OpenAI o Gemini).
 * Ahora soporta OpenAI para mayor calidad visual y fidelidad Pixar.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStylizedAvatarInputSchema = z.object({
  facePhotoDataUri: z
    .string()
    .describe("Foto del rostro del usuario en formato data URI."),
  figurePhotoDataUri: z
    .string()
    .describe("Foto del cuerpo completo del usuario en formato data URI."),
  preferOpenAI: z.boolean().optional().default(false),
});
export type GenerateStylizedAvatarInput = z.infer<
  typeof GenerateStylizedAvatarInputSchema
>;

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string().describe("Data URI de la imagen del avatar generado."),
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
    // Si el usuario prefiere OpenAI y tenemos soporte (vía DALL-E 3)
    if (input.preferOpenAI) {
      // Paso 1: Usar GPT-4o para analizar los rasgos reales del usuario
      const analysisResponse = await ai.generate({
        model: 'openai/gpt-4o',
        prompt: [
          { media: { url: input.facePhotoDataUri } },
          { media: { url: input.figurePhotoDataUri } },
          { text: 'Describe exactly the person in these photos for a 3D artist. Mention hair color, hair style, facial shape, eye color, and body type. Be very specific so an artist can recreate this person as a 3D character.' },
        ],
      });

      const description = analysisResponse.text;

      // Paso 2: Usar DALL-E 3 para generar la imagen Pixar definitiva
      const generationResponse = await ai.generate({
        model: 'openai/dall-e-3',
        prompt: `A professional 3D animated character in the style of Disney/Pixar movie (like Toy Story or Frozen). The character must have: ${description}. Clear 3D render, subsurface scattering, expressive face, stylish clothing. BACKGROUND MUST BE PURE WHITE. Cinematic lighting, 4k resolution.`,
      });

      if (generationResponse.media && generationResponse.media.url) {
        return { avatarDataUri: generationResponse.media.url };
      }
    }

    // Fallback o opción por defecto: Gemini 2.0 Flash (Multimodal Output)
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        { media: { url: input.facePhotoDataUri } },
        { media: { url: input.figurePhotoDataUri } },
        { text: 'Analyze these two photos and generate a NEW high-quality 3D animated character in Pixar style that looks EXACTLY like the person in the photos (same hair, face, build). Requirements: 1) Pixar 3D aesthetic. 2) PURE WHITE BACKGROUND. 3) Output ONLY the resulting image.' },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (response.media && response.media.url) {
      return { avatarDataUri: response.media.url };
    }
    
    throw new Error("No se pudo generar la imagen. Asegúrate de que tu API Key sea válida y de pago.");
  }
);
