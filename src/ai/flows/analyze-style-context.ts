
'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando Gemini 1.5 Flash.
 */

import { getGenkit, GEMINI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeStyleInputSchema = z.object({
  facePhotoDataUri: z.string().describe("Foto del rostro como data URI base64."),
  figurePhotoDataUri: z.string().describe("Foto del cuerpo como data URI base64."),
  geminiApiKey: z.string().optional(),
});

const AnalyzeStyleOutputSchema = z.object({
  figureAnalysis: z.string().describe('Tipo de figura corporal identificada.'),
  colorimetryAnalysis: z.string().describe('Paleta de colorimetría estacional.'),
  visualDescription: z.string().describe('Descripción detallada para recrear a la persona en estilo Pixar 3D.'),
});

export type AnalyzeStyleInput = z.infer<typeof AnalyzeStyleInputSchema>;
export type AnalyzeStyleOutput = z.infer<typeof AnalyzeStyleOutputSchema>;

export async function analyzeStyleContext(input: AnalyzeStyleInput): Promise<AnalyzeStyleOutput> {
  const dynamicAI = getGenkit(input.geminiApiKey);

  const { output } = await dynamicAI.generate({
    model: GEMINI_MODEL,
    prompt: [
      { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
      { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
      { text: 'Actúa como un experto en colorimetría y morfología de moda. Analiza estas fotos y determina: 1. El tipo de figura corporal exacta. 2. La paleta de colorimetría estacional específica (Primavera, Verano, Otoño, Invierno y su subtipo). 3. Una descripción física detallada para que una IA generadora de imágenes pueda recrear a esta persona en estilo Pixar 3D perfecto con fondo blanco puro.' },
    ],
    output: { schema: AnalyzeStyleOutputSchema }
  });

  if (!output) throw new Error("Gemini no pudo procesar las fotos del perfil.");
  return output;
}
