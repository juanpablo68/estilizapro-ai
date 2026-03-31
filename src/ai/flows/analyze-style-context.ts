'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Detecta subtonos, contraste facial y matices detallados para una asesoría de alta precisión.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const BiometricDataSchema = z.object({
  genero: z.string(),
  edad_aproximada: z.string(),
  colorimetria: z.object({
    tono_piel: z.string().describe('claro, medio, oscuro'),
    subtono: z.string().describe('cálido, frío, neutro'),
    contraste_facial: z.string().describe('bajo, medio, alto'),
    hex_piel: z.string(),
    estacion_sugerida: z.string().describe('Invierno, Verano, Otoño, Primavera y su variante (ej: Otoño Cálido)')
  }),
  rostro: z.object({
    forma: z.string(),
    ojos: z.object({
      color_detalle: z.string().describe('miel, verde oliva, azul grisáceo, etc.'),
      forma: z.string()
    }),
    cabello: z.object({
      color_natural: z.string(),
      textura: z.string()
    })
  }),
  cuerpo: z.object({
    complexion: z.string(),
    figura_geometrica: z.string().describe('Reloj de arena, pera, rectángulo, triángulo invertido, manzana'),
    proporcion_hombros_cadera: z.string()
  }),
  nivel_confianza: z.string()
});

const AnalyzeStyleInputSchema = z.object({
  facePhotoDataUri: z.string(),
  figurePhotoDataUri: z.string(),
  openaiApiKey: z.string().optional(),
});

const AnalyzeStyleOutputSchema = z.object({
  biometricData: BiometricDataSchema,
  figureAnalysis: z.string(),
  colorimetryAnalysis: z.string(),
});

export type AnalyzeStyleInput = z.infer<typeof AnalyzeStyleInputSchema>;
export type AnalyzeStyleOutput = z.infer<typeof AnalyzeStyleOutputSchema>;

export async function analyzeStyleContext(input: AnalyzeStyleInput): Promise<AnalyzeStyleOutput> {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Actúa como un experto de élite en morfología y colorimetría profesional para PILAR CIFUENTES.
        
        REGLAS CRÍTICAS DE ANÁLISIS:
        1. NO puedes devolver valores vacíos o "no identificado". Debes mojarte y dar un diagnóstico basado en la evidencia visual.
        2. OJOS Y CABELLO: Analiza el matiz exacto (ej: "miel con destellos dorados", "verde oliva profundo"). 
        3. PIEL: Determina el subtono (Cálido/Frío) analizando si la piel tiene matices rosados/azulados (Frío) o amarillentos/dorados (Cálido).
        4. FIGURA: Identifica la silueta geométrica exacta (Reloj de Arena, Pera, Triángulo Invertido, etc.).
        5. ESTACIÓN: Dictamina una de las 12 estaciones (ej: Verano Suave, Invierno Brillante, Otoño Verdadero).

        IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON estructurado. Asegúrate de que las llaves coincidan exactamente con el esquema solicitado.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Realiza el análisis biométrico profundo y diagnóstico de estas fotos para Pilar Cifuentes." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  // Normalización de datos para asegurar que siempre haya texto en el UI
  const figura = content.cuerpo?.figura_geometrica || 'Silueta por definir';
  const complexion = content.cuerpo?.complexion || '';
  const estacion = content.colorimetria?.estacion_sugerida || 'Estación por definir';
  const subtono = content.colorimetria?.subtono || 'Neutro';
  const contraste = content.colorimetria?.contraste_facial || 'Medio';

  const figureText = `Figura: ${figura} (${complexion})`;
  const colorText = `Diagnóstico: ${estacion} (Subtono ${subtono}, Contraste ${contraste})`;

  return {
    biometricData: content as z.infer<typeof BiometricDataSchema>,
    figureAnalysis: figureText,
    colorimetryAnalysis: colorText
  };
}
