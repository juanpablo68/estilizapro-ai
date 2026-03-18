
'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando Gemini 1.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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
  const { output } = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    prompt: [
      { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
      { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
      { text: 'Actúa como un experto en colorimetría y morfología de moda de alto nivel. Analiza estas fotos optimizadas y determina: 1. El tipo de figura corporal exacta. 2. La paleta de colorimetría estacional específica. 3. Una descripción física MUY detallada (rasgos, cabello, ropa que lleva, complexión) para que una IA generativa cree un avatar Pixar 3D perfecto de esta persona.' },
    ],
    output: { schema: AnalyzeStyleOutputSchema }
  });

  if (!output) throw new Error("Gemini no pudo procesar las fotos del perfil.");
  return output;
}
