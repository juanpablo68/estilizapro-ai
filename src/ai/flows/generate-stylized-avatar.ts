'use server';
/**
 * @fileOverview Generación de Avatar Pixar utilizando IA.
 * Soporta OpenAI (DALL-E 3) para máxima calidad si se proporciona una clave.
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
  openaiApiKey: z.string().optional().describe("Clave de API de OpenAI proporcionada por el usuario."),
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
    // Si se prefiere OpenAI y tenemos los medios para usarlo
    if (input.preferOpenAI || input.openaiApiKey) {
      try {
        // Configuramos la clave temporalmente para este proceso si se pasó desde el cliente
        if (input.openaiApiKey) {
          process.env.OPENAI_API_KEY = input.openaiApiKey;
        }

        // Paso 1: Analizar rasgos con GPT-4o
        const analysisResponse = await ai.generate({
          model: 'openai/gpt-4o',
          prompt: [
            { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
            { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
            { text: 'Analyze these photos. Describe the person for a 3D Pixar artist: hair style/color, face shape, eye color, clothing style, and body build. Be extremely concise.' },
          ],
        });

        const description = analysisResponse.text;

        // Paso 2: Generar con DALL-E 3
        const generationResponse = await ai.generate({
          model: 'openai/dall-e-3',
          prompt: `A professional 3D animated character in Disney/Pixar style. Character features: ${description}. PURE WHITE BACKGROUND. Full body shot, cinematic lighting, 4k render, masterpiece.`,
        });

        if (generationResponse.media?.url) {
          return { avatarDataUri: generationResponse.media.url };
        }
      } catch (error) {
        console.error("Error con OpenAI, intentando Gemini como respaldo:", error);
      }
    }

    // Respaldo con Gemini 2.0 Flash
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
        { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
        { text: 'Generate a 3D Pixar-style animated character that looks exactly like the person in these photos. Requirements: 1) Match face, hair, and build. 2) PURE WHITE BACKGROUND. 3) Output only the resulting image.' },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (response.media?.url) {
      return { avatarDataUri: response.media.url };
    }
    
    throw new Error("No se pudo generar el avatar. Verifica tus claves de API en Ajustes.");
  }
);
