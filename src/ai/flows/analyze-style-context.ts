'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando OpenAI GPT-4o.
 * Se ha refinado para extraer rasgos faciales específicos (ojos, cabello, piel).
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
  visualDescription: z.string().describe('Descripción técnica ultra-detallada para DALL-E 3.'),
});

export type AnalyzeStyleInput = z.infer<typeof AnalyzeStyleInputSchema>;
export type AnalyzeStyleOutput = z.infer<typeof AnalyzeStyleOutputSchema>;

export async function analyzeStyleContext(input: AnalyzeStyleInput): Promise<AnalyzeStyleOutput> {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el análisis maestro.");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Eres un experto Master Stylist e Ingeniero de Prompts para Pixar. 
        Tu misión es analizar las fotos del usuario para crear una descripción técnica perfecta para un generador de imágenes 3D.
        
        DEBES EXTRAER CON PRECISIÓN:
        1. ROSTRO: Forma de ojos y color exacto (iris), forma de nariz, labios y estructura ósea.
        2. CABELLO: Textura (liso, rizado), longitud, corte y color exacto con matices.
        3. PIEL: Tono exacto (ej: marfil, oliva, canela) y subtono (cálido/frío).
        4. CUERPO: Proporciones reales, altura aparente y silueta dominante.
        
        Devuelve un JSON con:
        - figureAnalysis: Nombre de la silueta (ej: Reloj de Arena).
        - colorimetryAnalysis: Estación de color (ej: Verano Suave).
        - visualDescription: Un prompt narrativo detallado que describa al personaje en estilo Pixar 3D, mencionando todos los rasgos faciales y físicos extraídos.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza mi esencia física para crear mi avatar 3D cinematográfico." },
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
    visualDescription: content.visualDescription || "Persona con estilo elegante"
  };
}
