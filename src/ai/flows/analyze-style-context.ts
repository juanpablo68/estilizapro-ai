'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Se enfoca en obtener etiquetas precisas de color de ojos, cabello y piel.
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
        content: `Eres un experto en fisionomía y colorimetría forense. Analiza las fotos para identificar rasgos con precisión absoluta.
        
        REGLAS DE IDENTIFICACIÓN:
        1. GÉNERO: Identifica basándote en rasgos fisionómicos reales (Masculino/Femenino).
        2. OJOS: Realiza un zoom virtual al iris. Identifica matices claros: Miel, Ámbar, Verde Oliva, Hazel, Azul Acero, Gris, etc. NO digas solo "Marrón" si hay matices.
        3. CABELLO: Determina el tono exacto (Castaño Claro, Rubio Ceniza, Pelirrojo, etc.) y la textura.
        4. SILUETA: Identifica la figura geométrica (Reloj de Arena, Triángulo Invertido, Rectángulo, Pera, Óvalo).

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
          { type: "text", text: "Analiza el iris, la raíz del cabello y la silueta corporal. Identifica el género real." },
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
  const figura = content.cuerpo?.figura_geometrica || 'Reloj de Arena';
  const ojos = content.rostro?.ojos?.color_detalle || 'No identificado';
  const cabello = content.rostro?.cabello?.color_natural || 'No identificado';
  const estacion = content.colorimetria?.estacion_sugerida || 'Otoño';

  return {
    biometricData: content,
    figureAnalysis: `Figura: ${figura}`,
    colorimetryAnalysis: `${estacion} (${genero}, Ojos ${ojos}, Pelo ${cabello})`
  };
}
