'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando Gemini Flash Lite.
 */

import { getGenkitEngine } from '@/ai/genkit';
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
  const { ai, model } = getGenkitEngine(input.geminiApiKey);

  const { output } = await ai.generate({
    model: model,
    prompt: [
      { media: { url: input.facePhotoDataUri, contentType: 'image/jpeg' } },
      { media: { url: input.figurePhotoDataUri, contentType: 'image/jpeg' } },
      { text: 'Analiza estas fotos. Determina: 1. Figura corporal exacta. 2. Colorimetría estacional específica. 3. Descripción física detallada para generar un avatar 3D Pixar profesional con fondo blanco.' },
    ],
    output: { schema: AnalyzeStyleOutputSchema }
  });

  if (!output) throw new Error("Gemini Lite no pudo procesar las fotos del perfil.");
  return output;
}
