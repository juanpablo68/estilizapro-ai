'use server';
/**
 * @fileOverview Generación visual de maquillaje y peinado (Visagismo).
 * - Transforma el consejo del chat en un prompt visual conciso.
 * - Elimina parámetros conflictivos para evitar Error 400.
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

    // Paso 1: Resumir el consejo en un prompt visual corto para evitar errores de longitud o contenido
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Resume este consejo de belleza en una descripción visual muy breve de 2 frases para un generador de imágenes. Enfócate solo en peinado y maquillaje. Responde en inglés." 
        },
        { role: "user", content: input.description }
      ],
    });

    const visualPrompt = summaryResponse.choices[0].message.content || input.description;

    let facialHairInstruction = "";
    if (personType === 'Masculino') {
      facialHairInstruction = hasBeard 
        ? "The man has a well-groomed beard." 
        : "The man is clean-shaven.";
    }

    const finalPrompt = `High-end beauty editorial close-up portrait of ONE ${personType}. 
    LOOK: ${visualPrompt}. 
    TRAITS: Skin ${skinTone}, Hair ${hairColor}. ${facialHairInstruction}
    STYLE: Modern 3D stylized character, Pixar-quality lighting. 
    ENVIRONMENT: Solid pure white background. Minimalist and professional.`;

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
      if (!imageData) throw new Error("Error en la generación visual.");

      return { previewImageDataUri: `data:image/png;base64,${imageData}` };
    } catch (error: any) {
      console.error("DALL-E Grooming Error:", error);
      throw new Error(error.message || "Error al generar la vista previa estética.");
    }
  }
);
