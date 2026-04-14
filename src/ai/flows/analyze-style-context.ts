
'use server';
/**
 * @fileOverview Análisis Biométrico Quirúrgico.
 * Clasifica estrictamente en el modelo moderno de temperatura (Cálido/Frío).
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
        content: `Eres un experto en fisionomía y colorimetría profesional. 
        
        REGLAS MODERNAS:
        1. TEMPERATURA: Clasifica exclusivamente como "Cálida" o "Fría".
        2. SILUETA: Identifica la figura geométrica corporal predominante.
        3. RASGOS: Identifica color exacto de ojos y cabello.

        RESPONDE SOLO EN JSON:
        {
          "genero": "Masculino/Femenino",
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
          { type: "text", text: "Analiza mi temperatura de color (Cálida/Fría), figura y rasgos faciales." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  const temperatura = content.temperatura || 'Cálida';
  const figura = content.cuerpo?.figure_geometrica || 'Reloj de Arena';
  const ojos = content.rostro?.ojos?.color_detalle || 'Detectado';

  return {
    biometricData: content,
    figureAnalysis: `Figura ${figura}`,
    colorimetryAnalysis: `Subtono ${temperatura} (Ojos ${ojos})`
  };
}
