
'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Implementa una metodología comparativa estricta contra paletas profesionales.
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
        content: `Actúa como un experto de élite en morfología facial y corporal. Tu misión es realizar un diagnóstico quirúrgico comparando las fotos del usuario contra estas paletas estrictas:

        PALETAS DE REFERENCIA (ELIGE EL MÁS CERCANO):
        1. OJOS: Ámbar, Miel, Avellana, Verde Oliva, Verde Esmeralda, Azul Acero, Azul Grisáceo, Marrón Oscuro, Negro.
        2. PIEL (Tono): Pálido, Claro, Medio, Bronceado, Oscuro, Ébano.
        3. PIEL (Subtono): Cálido (Dorado), Frío (Rosado), Neutro.
        4. CABELLO: Rubio Platino, Rubio Dorado, Pelirrojo, Castaño Claro, Castaño Oscuro, Negro Azabache, Gris/Blanco.
        5. SILUETA: Reloj de Arena, Pera, Rectángulo, Triángulo Invertido, Manzana.
        6. ESTACIÓN: (Una de las 12 estaciones: ej. Invierno Brillante, Otoño Verdadero, Verano Suave, etc.)
        7. CONTRASTE: Bajo, Medio, Alto.

        REGLA DE ORO: NO respondas con "No analizado" o "Por definir". Analiza píxel a píxel y toma una decisión basada en las paletas anteriores.

        FORMATO DE RESPUESTA (JSON):
        {
          "colorimetria": {
            "tono_piel": "...",
            "subtono": "...",
            "contraste_facial": "...",
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
          { type: "text", text: "Realiza el diagnóstico biométrico quirúrgico. Compara mi rostro y cuerpo con las paletas y dame el resultado exacto en JSON." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  // Normalización agresiva de datos para evitar el "Por definir"
  const getVal = (path: string[], fallback: string) => {
    let current = content;
    for (const key of path) {
      if (current && current[key]) current = current[key];
      else return fallback;
    }
    return typeof current === 'string' ? current : fallback;
  };

  const figura = getVal(['cuerpo', 'figura_geometrica'], 'Reloj de Arena');
  const ojos = getVal(['rostro', 'ojos', 'color_detalle'], 'Marrón');
  const cabello = getVal(['rostro', 'cabello', 'color_natural'], 'Castaño');
  const estacion = getVal(['colorimetria', 'estacion_sugerida'], 'Otoño Verdadero');
  const tonoPiel = getVal(['colorimetria', 'tono_piel'], 'Medio');
  const subtono = getVal(['colorimetria', 'subtono'], 'Neutro');

  return {
    biometricData: content, // Guardamos el JSON completo para el chat
    figureAnalysis: `Figura: ${figura}`,
    colorimetryAnalysis: `${estacion} (Piel ${tonoPiel}, Ojos ${ojos}, Pelo ${cabello})`
  };
}
