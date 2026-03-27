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
    figura_geometrica: z.string().describe('Reloj de arena, pera, etc.'),
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
        
        INSTRUCCIONES DE ANÁLISIS:
        1. Compara el tono de piel, ojos y cabello contra paletas de colorimetría profesional (12 estaciones).
        2. Identifica el matiz exacto de los ojos (no solo "café", sino "café miel", "verde oliva", etc.).
        3. Determina el subtono (Cálido/Frío/Neutro) analizando la reacción visual de la piel en las fotos.
        4. Define el nivel de contraste (Diferencia tonal entre piel, ojos y cejas/cabello).
        5. Analiza la silueta corporal completa para dictaminar la figura geométrica.

        IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON estructurado según el esquema solicitado.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Realiza el análisis biométrico profundo y diagnóstico de estas fotos." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || "{}");
  
  const figureText = `Figura: ${content.cuerpo?.figura_geometrica || 'No identificada'} (${content.cuerpo?.complexion || ''})`;
  const colorText = `Diagnóstico: ${content.colorimetria?.estacion_sugerida || 'No identificado'} (Subtono ${content.colorimetria?.subtono || ''}, Contraste ${content.colorimetria?.contraste_facial || ''})`;

  return {
    biometricData: content as z.infer<typeof BiometricDataSchema>,
    figureAnalysis: figureText,
    colorimetryAnalysis: colorText
  };
}
