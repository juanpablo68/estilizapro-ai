
'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico.
 * Simplificado a modelo moderno de temperatura (Cálido/Frío).
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
        content: `Eres un experto en fisionomía y colorimetría profesional. Analiza las fotos para identificar rasgos con precisión.
        
        REGLAS DE IDENTIFICACIÓN:
        1. GÉNERO: Masculino o Femenino.
        2. TEMPERATURA DE COLOR: Clasifica estrictamente como "Cálida" (subtonos amarillos/dorados) o "Fría" (subtonos azules/rosados).
        3. OJOS: Matiz específico (Miel, Hazel, Verde, Azul, etc.).
        4. CABELLO: Tono natural.
        5. SILUETA: Figura geométrica (Reloj de Arena, Triángulo, etc.).

        RESPONDE EXCLUSIVAMENTE EN JSON:
        {
          "genero": "...",
          "temperatura": "Cálida/Fría",
          "colorimetria": {
            "tono_piel": "...",
            "subtono_detalle": "..."
          },
          "rostro": {
            "ojos": { "color_detalle": "..." },
            "cabello": { "color_natural": "..." }
          },
          "cuerpo": {
            "figure_geometrica": "..."
          }
        }`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Identifica el género, temperatura de color (Cálida/Fría), color de ojos y silueta completa." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  const genero = content.genero || 'No identificado';
  const temperatura = content.temperatura || 'Cálida';
  const figura = content.cuerpo?.figure_geometrica || 'Reloj de Arena';
  const ojos = content.rostro?.ojos?.color_detalle || 'No identificado';
  const cabello = content.rostro?.cabello?.color_natural || 'No identificado';

  return {
    biometricData: content,
    figureAnalysis: `Figura: ${figura}`,
    colorimetryAnalysis: `Paleta ${temperatura} (${genero}, Ojos ${ojos})`
  };
}
