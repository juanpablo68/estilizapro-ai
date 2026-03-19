'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando OpenAI GPT-4o (Cerebro de Razonamiento).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const AnalyzeStyleInputSchema = z.object({
  facePhotoDataUri: z.string().describe("Foto del rostro como data URI base64."),
  figurePhotoDataUri: z.string().describe("Foto del cuerpo como data URI base64."),
  openaiApiKey: z.string().optional(),
});

const AnalyzeStyleOutputSchema = z.object({
  figureAnalysis: z.string().describe('Tipo de figura corporal identificada.'),
  colorimetryAnalysis: z.string().describe('Paleta de colorimetría estacional.'),
  visualDescription: z.string().describe('Descripción detallada para recrear a la persona en estilo Pixar 3D.'),
});

export type AnalyzeStyleInput = z.infer<typeof AnalyzeStyleInputSchema>;
export type AnalyzeStyleOutput = z.infer<typeof AnalyzeStyleOutputSchema>;

export async function analyzeStyleContext(input: AnalyzeStyleInput): Promise<AnalyzeStyleOutput> {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el análisis.");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un experto en colorimetría y morfología corporal de Pilar Cifuentes Catalán. Analiza las imágenes y devuelve un JSON con: figureAnalysis, colorimetryAnalysis y visualDescription (para Pixar 3D)."
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza mi rostro y mi cuerpo para determinar mi perfil de estilo." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || "{}");
  
  return {
    figureAnalysis: content.figureAnalysis || "No identificada",
    colorimetryAnalysis: content.colorimetryAnalysis || "No identificada",
    visualDescription: content.visualDescription || "Persona con estilo casual"
  };
}
