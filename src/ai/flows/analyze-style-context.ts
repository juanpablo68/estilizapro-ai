'use server';
/**
 * @fileOverview Análisis de colorimetría y figura corporal utilizando OpenAI GPT-4o.
 * Refinado para extracción técnica de rasgos faciales y físicos con precisión quirúrgica.
 */

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
        content: `Eres un experto Master Stylist e Ingeniero de Personajes para Pixar Animation Studios. 
        Tu misión es analizar las fotos reales del usuario para crear una descripción técnica exacta para un generador de imágenes 3D.
        
        PROHIBICIÓN: No uses rasgos genéricos de biblioteca. DEBES interpretar y describir ÚNICAMENTE lo que ves en las fotos.
        
        DEBES EXTRAER CON PRECISIÓN ABSOLUTA:
        1. ROSTRO: Forma exacta de ojos (almendrados, redondos, etc.), color de iris detallado, forma de nariz, volumen de labios y estructura ósea (pómulos, mandíbula).
        2. CABELLO: Textura real (liso, ondulado, rizado), longitud exacta, peinado visible y color con matices (ej: castaño oscuro con reflejos cobrizos).
        3. PIEL: Tono real (ej: porcelana, oliva dorado, ébano) y subtono (cálido/frío/neutro).
        4. CUERPO: Silueta dominante, proporciones visibles de hombros, cintura y cadera.
        
        Devuelve un JSON con:
        - figureAnalysis: Nombre de la silueta real.
        - colorimetryAnalysis: Estación de color real.
        - visualDescription: Un prompt narrativo ultra-detallado centrado en los rasgos físicos únicos extraídos de las fotos para crear un avatar 3D fiel.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza mi esencia física real en estas fotos para crear mi avatar 3D cinematográfico personalizado." },
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
    visualDescription: content.visualDescription || "Persona con rasgos únicos"
  };
}
