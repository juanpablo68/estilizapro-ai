'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Implementa una metodología comparativa estricta contra paletas profesionales.
 * Optimizado para detección de matices sutiles en ojos (claros/mixtos) y cabello.
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
        content: `Actúa como un experto de élite en colorimetría y morfología. Tu misión es realizar un diagnóstico quirúrgico. 
        
        INSTRUCCIONES DE ANÁLISIS:
        1. OJOS (CRÍTICO): Analiza el iris. Busca matices. Si hay destellos dorados o verdes sobre base clara, especifica (ej. "Miel", "Verde Oliva"). No generalices a "Marrón" si hay claridad.
        2. CABELLO: Determina el color base. Distingue entre "Castaño Oscuro" y "Negro". Si el cabello refleja luz, es "Castaño".
        3. PIEL: Analiza el subtono en la zona de la mandíbula y cuello para evitar sombras faciales.
        4. GÉNERO: Identifica basándote en estructura ósea y facciones.

        PALETAS DE REFERENCIA OBLIGATORIAS:
        - OJOS: Ámbar, Miel, Avellana, Verde Oliva, Verde Esmeralda, Azul Acero, Azul Grisáceo, Azul Claro, Marrón Claro, Marrón Oscuro, Negro.
        - CABELLO: Rubio Platino, Rubio Dorado, Pelirrojo, Castaño Claro, Castaño Medio, Castaño Oscuro, Negro Azabache, Gris, Blanco.
        - PIEL (Tono): Muy Pálido, Claro, Medio, Bronceado, Oscuro, Ébano.
        - PIEL (Subtono): Cálido (Dorado), Frío (Rosado), Neutro.
        - FIGURA: Reloj de Arena, Pera, Rectángulo, Triángulo Invertido, Manzana.

        FORMATO DE RESPUESTA (JSON ESTRICTO):
        {
          "genero": "Masculino/Femenino",
          "colorimetria": {
            "tono_piel": "...",
            "subtono": "...",
            "contraste_facial": "Bajo/Medio/Alto",
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
          { type: "text", text: "Realiza el diagnóstico biométrico quirúrgico exacto. Analiza el matiz real de ojos y cabello comparando píxeles contra las paletas indicadas." },
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
  const cabello = getVal(['rostro', 'cabello', 'color_natural'], 'No identificado');
  const estacion = getVal(['colorimetria', 'estacion_sugerida'], 'Otoño');
  const tonoPiel = getVal(['colorimetria', 'tono_piel'], 'Claro');

  return {
    biometricData: content,
    figureAnalysis: `Figura: ${figura}`,
    colorimetryAnalysis: `${estacion} (${genero}, Ojos ${ojos}, Pelo ${cabello}, Piel ${tonoPiel})`
  };
}
