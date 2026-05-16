'use server';
/**
 * @fileOverview Análisis Biométrico Quirúrgico.
 * Optimizado para identificar con precisión el género y rasgos físicos.
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
    throw new Error("No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un experto en fisionomía y colorimetría profesional. 
          
          REGLAS CRÍTICAS DE IDENTIFICACIÓN:
          1. GÉNERO: Identifica con 100% de precisión si el usuario es "Masculino" o "Femenino". No te equivoques.
          2. RASGOS ÉTNICOS Y PIEL: Identifica el tono de piel real.
          3. TEMPERATURA: Clasifica exclusivamente como "Cálida" o "Fría".
          4. SILUETA: Identifica la figura geométrica corporal predominante.

          RESPONDE SOLO EN JSON:
          {
            "genero": "Masculino/Femenino",
            "temperatura": "Cálida/Fría",
            "colorimetria": {
              "tono_piel": "Ej: Piel blanca muy clara",
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
            { type: "text", text: "Analiza mi género, temperatura de color, figura y rasgos físicos para mi avatar." },
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
    console.error("Error crítico en el análisis biométrico:", error);
    throw new Error(error.message || "Error al procesar las imágenes en la IA.");
  }
}
