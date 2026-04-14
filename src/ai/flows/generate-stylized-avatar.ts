
'use server';
/**
 * @fileOverview FASE 2: Generación Artística de Avatar Estilizado.
 * Garantiza una ÚNICA figura de cuerpo completo sin elementos técnicos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
});

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>): Promise<z.infer<typeof GenerateStylizedAvatarOutputSchema>> {
  return generateStylizedAvatarFlow(input);
}

const generateStylizedAvatarFlow = ai.defineFlow(
  {
    name: 'generateStylizedAvatarFlow',
    inputSchema: GenerateStylizedAvatarInputSchema,
    outputSchema: GenerateStylizedAvatarOutputSchema,
  },
  async (input) => {
    const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API Key de OpenAI requerida.");

    const openai = new OpenAI({ apiKey });
    const data = input.biometricData || {};

    const personType = data.genero || 'Femenino';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural';
    const skinTemp = data.temperatura || 'Cálida';

    const finalPrompt = `A high-end professional fashion photograph of ONE SINGLE ${personType}. 
    FULL BODY SHOT: The image shows the entire person from the very top of their head to the very bottom of their shoes. 
    The subject is standing centrally in a confident fashion pose.
    
    AESTHETIC: High-end 3D animated character style. The person has ${hairColor} hair and a ${skinTemp} skin tone.
    
    COMPOSITION: 
    - THE SUBJECT IS CENTERED WITH PLENTY OF EMPTY SPACE AROUND THEM TO ENSURE NO CLIPPING.
    - THE BACKGROUND IS A SOLID, PLAIN, EMPTY, PURE WHITE (#FFFFFF) STUDIO ENVIRONMENT.
    - ABSOLUTELY NO TECHNICAL LINES, NO MEASUREMENTS, NO NUMBERS, NO TEXT, NO RULES, NO GRIDS.
    - NO SECONDARY FIGURES, NO MULTIPLE VIEWS, NO COLLAGE. JUST ONE SINGLE PERSON.
    - THE PERSON IS WEARING MODERN STYLISH SHOES.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
        response_format: "b64_json",
      });

      const imageData = response.data[0].b64_json;
      if (!imageData) throw new Error("Error en la generación.");

      return { avatarDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Error:", error);
      throw new Error(error.message || "Error al generar el avatar.");
    }
  }
);
