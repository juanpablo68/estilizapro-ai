'use server';
/**
 * @fileOverview Análisis Biométrico de Alta Fidelidad.
 * Extrae rasgos faciales y corporales detallados para garantizar un avatar fiel a la realidad.
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
          content: `Eres un experto en fisionomía, colorimetría y análisis de identidad visual. 
          
          Tu misión es describir al usuario con tal detalle que un motor de imagen pueda recrear su esencia única sin ser genérico.
          
          REGLAS DE ANÁLISIS FACIAL:
          1. FORMA: Identifica si el rostro es ovalado, cuadrado, corazón, etc.
          2. RASGOS CLAVE: Describe la proporción de la frente, la forma de la nariz, la línea de la mandíbula y la distancia entre los ojos.
          3. CABELLO Y PIEL: Tono exacto de piel y textura/color del cabello.
          4. GÉNERO: Identifica con 100% de precisión el género (Masculino/Femenino).

          RESPONDE SOLO EN JSON:
          {
            "genero": "Masculino/Femenino",
            "temperatura": "Cálida/Fría",
            "colorimetria": {
              "tono_piel": "Ej: Piel oliva clara",
              "subtono_detalle": "Detalle técnico"
            },
            "rostro": {
              "forma_rostro": "Ej: Rostro angular cuadrado",
              "mandibula": "Ej: Mandíbula marcada y fuerte",
              "nariz": "Ej: Nariz recta y proporcionada",
              "frente": "Ej: Frente amplia",
              "ojos": { "color_detalle": "Ej: Ojos café almendrados" },
              "cabello": { "color_natural": "...", "color_detalle": "..." }
            },
            "cuerpo": {
              "figure_geometrica": "..."
            }
          }`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza mis rasgos faciales únicos, mi género y mi figura para crear un avatar fiel a mi identidad." },
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
