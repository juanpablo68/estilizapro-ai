'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico utilizando OpenAI GPT-4o.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const BiometricDataSchema = z.object({
  genero: z.string(),
  edad_aproximada: z.string(),
  tono_piel: z.object({
    categoria: z.string(),
    hex_aproximado: z.string()
  }),
  rostro: z.object({
    forma: z.string(),
    ojos: z.object({
      color: z.string(),
      forma: z.string(),
      tamaño: z.string()
    }),
    nariz: z.string(),
    labios: z.string(),
    cejas: z.string()
  }),
  cabello: z.object({
    color: z.string(),
    tipo: z.string(),
    largo: z.string(),
    peinado: z.string()
  }),
  cuerpo: z.object({
    complexion: z.string(),
    proporcion_hombros: z.string(),
    proporcion_cintura: z.string(),
    proporcion_cadera: z.string(),
    altura_aproximada: z.string(),
    postura: z.string()
  }),
  rasgos_distintivos: z.array(z.string()),
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
        content: `Actúa como un sistema de análisis biométrico experto.
        FASE 1 — ANÁLISIS ESTRUCTURADO (OBLIGATORIO):
        Analiza ambas imágenes (rostro y cuerpo) y extrae únicamente atributos físicos reales observables. 
        No inventes información. No estilices. No embellezcas. 
        Si algún atributo no es claro, márcalo como "no determinable". Mantén coherencia entre rostro y cuerpo.
        
        Reglas críticas:
        - No cambiar género bajo ninguna circunstancia.
        - No asumir datos no visibles.
        - No promediar rasgos.
        - Precisión > estética.
        
        Devuelve el análisis en el formato JSON solicitado.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Realiza el análisis biométrico completo de estas fotos." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || "{}");
  
  return {
    biometricData: content as z.infer<typeof BiometricDataSchema>,
    figureAnalysis: content.cuerpo?.complexion || "No identificada",
    colorimetryAnalysis: content.tono_piel?.categoria || "No identificada"
  };
}
