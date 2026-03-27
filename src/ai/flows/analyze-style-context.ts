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
    hex_piel: z.string()
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
        content: `Actúa como un experto en morfología y colorimetría profesional para PILAR CIFUENTES.
        
        Analiza las imágenes para identificar:
        1. Tono y Subtono de piel (Cálido/Frío/Neutro).
        2. Color de ojos con matiz exacto.
        3. Contraste facial (diferencia entre piel, ojos y cabello).
        4. Silueta corporal exacta.

        IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON estructurado.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Realiza el análisis biométrico profundo de estas fotos." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || "{}");
  
  const figureText = `Figura: ${content.cuerpo?.figura_geometrica || 'No identificada'} (${content.cuerpo?.complexion || ''})`;
  const colorText = `Paleta: ${content.colorimetria?.subtono || 'No identificada'} con contraste ${content.colorimetria?.contraste_facial || ''}`;

  return {
    biometricData: content as z.infer<typeof BiometricDataSchema>,
    figureAnalysis: figureText,
    colorimetryAnalysis: colorText
  };
}
