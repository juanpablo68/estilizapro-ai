'use server';
/**
 * @fileOverview Generación visual de Visagismo (Grooming).
 * Traduce el consejo del asistente en una imagen técnica y limpia.
 * Versión ultra-estable sin parámetros experimentales.
 */

import { ai, getOpenAIKey } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateGroomingPreviewInputSchema = z.object({
  description: z.string().describe("Consejo estético del asistente"),
  biometricData: z.any().optional(),
  hasBeard: z.boolean().optional(),
  openaiApiKey: z.string().optional(),
});

const GenerateGroomingPreviewOutputSchema = z.object({
  previewImageDataUri: z.string(),
});

export async function generateGroomingPreview(input: z.infer<typeof GenerateGroomingPreviewInputSchema>): Promise<z.infer<typeof GenerateGroomingPreviewOutputSchema>> {
  return generateGroomingPreviewFlow(input);
}

const generateGroomingPreviewFlow = ai.defineFlow(
  {
    name: 'generateGroomingPreviewFlow',
    inputSchema: GenerateGroomingPreviewInputSchema,
    outputSchema: GenerateGroomingPreviewOutputSchema,
  },
  async (input) => {
    const apiKey = getOpenAIKey(input.openaiApiKey);
    if (!apiKey) throw new Error("API Key de OpenAI requerida.");

    const openai = new OpenAI({ apiKey });
    const data = input.biometricData || {};

    const personType = data.genero || 'Femenino';
    const hairColor = data.rostro?.cabello?.color_natural || 'natural';
    const skinTone = data.colorimetria?.tono_piel || 'light skin';
    const hasBeard = input.hasBeard || false;

    // Resumir el consejo conversacional en un prompt físico de imagen
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `Translate this beauty advice into a 1-sentence physical description for DALL-E. 
          Focus on hairstyle, skin finish, and grooming. 
          If gender is Male, describe the beard state clearly: ${hasBeard ? 'neatly groomed beard' : 'clean shaven face'}. 
          Language: English.` 
        },
        { role: "user", content: input.description }
      ],
    });

    const visualTrait = summaryResponse.choices[0].message.content || "professional grooming";

    const finalPrompt = `A high-end professional beauty editorial portrait of ONE ${personType}. 
    GROOMING: ${visualTrait}. 
    PHYSICAL: Skin tone ${skinTone}, Hair ${hairColor}. 
    STYLE: Modern 3D stylized character design, Pixar-quality lighting, high fashion photography. 
    ENVIRONMENT: Solid pure white background (#FFFFFF). Extremely clean and centered.`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      });

      const imageData = response.data[0].b64_json;
      if (!imageData) throw new Error("La IA no devolvió datos de imagen.");

      return { previewImageDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Grooming Error:", error);
      throw new Error(error.message || "Error al generar la vista previa visual.");
    }
  }
);
