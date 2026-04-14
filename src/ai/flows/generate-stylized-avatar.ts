
'use server';
/**
 * @fileOverview Generación de Avatar Estilizado Profesional.
 * Blindaje absoluto contra líneas técnicas y figuras múltiples.
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

    const finalPrompt = `High-end professional fashion editorial of ONE SINGLE ${personType}. 
    FULL LENGTH SHOT: The person is fully visible from the top of the head to the bottom of their shoes. 
    The subject is standing centrally in a neutral fashion pose.
    
    AESTHETIC: Modern 3D stylized character with Pixar-quality lighting. ${hairColor} hair and ${skinTemp} skin tone.
    
    COMPOSITION RULES:
    - THE SUBJECT IS THE ONLY FIGURE IN THE IMAGE. NO SECONDARY MODELS.
    - BACKGROUND IS A SOLID, PURE, EMPTY, INMACULATE WHITE (#FFFFFF) INFINITE VOID.
    - ABSOLUTELY NO LINES, NO RULERS, NO MEASUREMENTS, NO NUMBERS, NO GRIDS, NO HORIZON LINES.
    - NO CHARACTER SHEETS, NO MULTIPLE VIEWS. JUST ONE SINGLE PERSON.
    - THE PERSON IS WEARING STYLISH MODERN SHOES.`;

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
