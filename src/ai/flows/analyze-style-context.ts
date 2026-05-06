'use server';
/**
 * @fileOverview Análisis Biométrico Quirúrgico.
 * Clasifica estrictamente en el modelo moderno de temperatura (Cálido/Frío).
 * Extrae rasgos físicos exactos para fidelidad visual.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

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
  const apiKey = getOpenAIKey(input.openaiApiKey);
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("No se detectó una API Key de OpenAI válida. Configúrala en 'Ajustes' o en el entorno.");
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un experto en fisionomía y colorimetría profesional de alta gama. 
          
          REGLAS DE IDENTIFICACIÓN:
          1. RASGOS ÉTNICOS Y PIEL: Identifica con precisión el tono de piel real (ej. Muy claro, Blanco, Trigueño, Moreno, etc.) y rasgos faciales.
          2. TEMPERATURA: Clasifica exclusivamente como "Cálida" o "Fría".
          3. SILUETA: Identifica la figura geométrica corporal predominante.
          4. CABELLO Y OJOS: Identifica el color natural exacto.

          RESPONDE SOLO EN JSON:
          {
            "genero": "Masculino/Femenino",
            "temperatura": "Cálida/Fría",
            "colorimetria": {
              "tono_piel": "Ej: Piel blanca muy clara / Fair skin",
              "subtono_detalle": "Detalle técnico breve"
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
            { type: "text", text: "Analiza mi temperatura de color, figura y rasgos físicos exactos para generar un avatar idéntico a mí." },
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
    const piel = content.colorimetria?.tono_piel || 'Blanca';

    return {
      biometricData: content,
      figureAnalysis: `Figura ${figura}`,
      colorimetryAnalysis: `Subtono ${temperatura} (${piel})`
    };
  } catch (error: any) {
    console.error("Error en Análisis de Estilo:", error);
    throw new Error(error.message || "Error al analizar las imágenes.");
  }
}
