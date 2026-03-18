
'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando Gemini 1.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeStyleInputSchema = z.object({
  facePhotoDataUri: z.string().describe("Foto del rostro como data URI base64."),
  figurePhotoDataUri: z.string().describe("Foto del cuerpo como data URI base64."),
});

const AnalyzeStyleOutputSchema = z.object({
  figureAnalysis: z.string().describe('Tipo de figura corporal identificada (ej: Reloj de arena, Rectángulo).'),
  colorimetryAnalysis: z.string().describe('Paleta de colorimetría estacional (ej: Otoño Cálido, Invierno Frío).'),
  visualDescription: z.string().describe('Descripción detallada para recrear a la persona en estilo Pixar 3D.'),
});

export type AnalyzeStyleInput = z.infer<typeof AnalyzeStyleInputSchema>;
export type AnalyzeStyleOutput = z.infer<typeof AnalyzeStyleOutputSchema>;

export async function analyzeStyleContext(input: AnalyzeStyleInput): Promise<AnalyzeStyleOutput> {
  return analyzeStyleFlow(input);
}

const analyzeStyleFlow = ai.defineFlow(
  {
    name: 'analyzeStyleFlow',
    inputSchema: AnalyzeStyleInputSchema,
    outputSchema: AnalyzeStyleOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
        { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
        { text: 'Actúa como un experto en colorimetría y morfología de moda. Analiza estas fotos y determina: 1. El tipo de figura corporal. 2. La paleta de colorimetría estacional. 3. Una descripción física detallada para que DALL-E 3 genere un avatar Pixar de esta persona.' },
      ],
      output: { schema: AnalyzeStyleOutputSchema }
    });

    if (!output) throw new Error("Gemini no pudo procesar las fotos.");
    return output;
  }
);
