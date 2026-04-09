'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Se enfoca en obtener etiquetas precisas de color de ojos, cabello y piel sin contaminar el flujo visual posterior.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const AnalyzeStyleInputSchema = z.object({
  facePhotoDataUri: z.string(),
  figurePhotoDataUri: z.string(),
  openaiApiKey: z.string().optional(),
});

const AnalyzeStyleOutputSchema = z.object({
  biometricData: z.any(),
  figureAnalysis: z.string(),
  colorimetryAnalysis: z.string(),
});

export async function analyzeStyleContext(input: z.infer<typeof AnalyzeStyleInputSchema>): Promise<z.infer<typeof AnalyzeStyleOutputSchema>> {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Eres un experto en colorimetría forense y morfología. Tu tarea es identificar con precisión quirúrgica los rasgos del usuario analizando las imágenes.
        
        INSTRUCCIONES DE IDENTIFICACIÓN:
        1. OJOS: No digas solo "Marrón". Busca matices claros, dorados o verdes (Miel, Ámbar, Verde Oliva, Hazel). Si son azules, distingue (Azul Acero, Azul Claro, Grisáceo).
        2. CABELLO: Determina el matiz real (Castaño Claro, Medio, Oscuro, Rubio Ceniza, etc.).
        3. PIEL: Determina Tono (Muy Pálido a Ébano) y Subtono (Cálido/Dorado, Frío/Rosado, Neutro).
        4. GÉNERO: Identifica basándote en rasgos óseos y fisionomía real.

        RESPONDE EXCLUSIVAMENTE EN JSON:
        {
          "genero": "Masculino/Femenino",
          "colorimetria": {
            "tono_piel": "...",
            "subtono": "...",
            "estacion_sugerida": "..."
          },
          "rostro": {
            "ojos": { "color_detalle": "..." },
            "cabello": { "color_natural": "..." }
          },
          "cuerpo": {
            "figura_geometrica": "..."
          }
        }`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analiza el iris y la raíz del cabello comparando contra matices profesionales. Identifica el género real." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  const getVal = (path: string[], fallback: string) => {
    let current = content;
    for (const key of path) {
      if (current && current[key]) current = current[key];
      else return fallback;
    }
    return typeof current === 'string' ? current : fallback;
  };

  const genero = content.genero || 'No identificado';
  const figura = getVal(['cuerpo', 'figura_geometrica'], 'Reloj de Arena');
  const ojos = getVal(['rostro', 'ojos', 'color_detalle'], 'No identificado');
  const cabello = getVal(['rostro.cabello.color_natural'], 'No identificado');
  const estacion = getVal(['colorimetria', 'estacion_sugerida'], 'Otoño');

  return {
    biometricData: content,
    figureAnalysis: `Figura: ${figura}`,
    colorimetryAnalysis: `${estacion} (${genero}, Ojos ${ojos}, Pelo ${cabello})`
  };
}
