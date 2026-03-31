'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Utiliza paletas de referencia estrictas para ojos, piel, cabello y silueta.
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
        content: `Actúa como un experto de élite en morfología y colorimetría profesional. 
        
        REGLA DE ORO: NO PUEDES USAR "DESCONOCIDO" O "POR DEFINIR". Debes elegir el valor más cercano de las siguientes paletas:

        1. OJOS (Matiz exacto): Ámbar, Miel, Avellana, Verde Oliva, Verde Esmeralda, Azul Acero, Azul Grisáceo, Marrón Oscuro, Negro.
        2. PIEL (Tono): Pálido, Claro, Medio, Bronceado, Oscuro, Ébano.
        3. PIEL (Subtono): Cálido (Dorado), Frío (Rosado), Neutro.
        4. CABELLO (Natural): Rubio Platino, Rubio Dorado, Pelirrojo, Castaño Claro, Castaño Oscuro, Negro Azabache, Gris/Blanco.
        5. SILUETA (Obligatorio elegir una): Reloj de Arena, Pera, Rectángulo, Triángulo Invertido, Manzana.
        6. ESTACIÓN: Una de las 12 estaciones (ej: Verano Suave, Otoño Verdadero, Invierno Brillante, etc.).

        FORMATO DE RESPUESTA (JSON ESTRICTO):
        {
          "colorimetria": {
            "tono_piel": "...",
            "subtono": "...",
            "contraste_facial": "bajo/medio/alto",
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
          { type: "text", text: "Realiza el diagnóstico biométrico quirúrgico usando las paletas indicadas." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  // Mapeo robusto para asegurar que los datos se extraigan correctamente
  const figura = content.cuerpo?.figura_geometrica || content.figura_geometrica || 'Silueta por definir';
  const ojos = content.rostro?.ojos?.color_detalle || content.color_ojos || 'Color ojos';
  const cabello = content.rostro?.cabello?.color_natural || content.color_cabello || 'Color cabello';
  const estacion = content.colorimetria?.estacion_sugerida || content.estacion || 'Estación por definir';
  const subtono = content.colorimetria?.subtono || content.subtono || 'Neutro';

  const figureText = `Figura: ${figura}`;
  const colorText = `${estacion} (Ojos ${ojos}, Pelo ${cabello}, Subtono ${subtono})`;

  return {
    biometricData: content,
    figureAnalysis: figureText,
    colorimetryAnalysis: colorText
  };
}