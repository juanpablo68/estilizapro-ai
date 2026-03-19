'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D Pixar de alta fidelidad utilizando DALL-E 3.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
});

const GenerateStylizedAvatarOutputSchema = z.object({
  avatarDataUri: z.string(),
});

export type GenerateStylizedAvatarInput = z.infer<typeof GenerateStylizedAvatarInputSchema>;
export type GenerateStylizedAvatarOutput = z.infer<typeof GenerateStylizedAvatarOutputSchema>;

export async function generateStylizedAvatar(input: GenerateStylizedAvatarInput): Promise<GenerateStylizedAvatarOutput> {
  return generateStylizedAvatarFlow(input);
}

const generateStylizedAvatarFlow = ai.defineFlow(
  {
    name: 'generateStylizedAvatarFlow',
    inputSchema: GenerateStylizedAvatarInputSchema,
    outputSchema: GenerateStylizedAvatarOutputSchema,
  },
  async (input) => {
    const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API Key de OpenAI requerida.");

    const openai = new OpenAI({ apiKey });
    const bio = input.biometricData;

    // Construcción del prompt maestro basado en el análisis de FASE 1
    const finalPrompt = `
      FASE 2 — GENERACIÓN DE AVATAR 3D PIXAR:
      Usando EXCLUSIVAMENTE estos datos biométricos reales: ${JSON.stringify(bio)}.
      
      REGLAS CRÍTICAS DE GENERACIÓN:
      - Usa el JSON anterior como ÚNICA fuente de verdad.
      - No usar caras genéricas ni de datasets. No mezclar identidades.
      - Género: ${bio.genero}. Tono de piel EXACTO: ${bio.tono_piel.categoria} (${bio.tono_piel.hex_aproximado}).
      - Rostro: ${bio.rostro.forma}, ojos ${bio.rostro.ojos.color} (${bio.rostro.ojos.forma}), nariz ${bio.rostro.nariz}, labios ${bio.rostro.labios}.
      - Cabello: ${bio.cabello.color}, ${bio.cabello.tipo}, peinado ${bio.cabello.peinado}.
      - Cuerpo: ${bio.cuerpo.complexion}, hombros ${bio.cuerpo.proporcion_hombros}, cintura ${bio.cuerpo.proporcion_cintura}.
      
      ESTILO VISUAL:
      - Personaje 3D estilo Pixar de alta calidad, render cinematográfico profesional.
      - Subsurface scattering en piel, iluminación global suave, materiales físicamente realistas.
      - Estilización leve sin perder identidad (no caricatura).
      
      CÁMARA E ILUMINACIÓN:
      - Plano de cuerpo completo, perspectiva cinematográfica tipo lente 50mm.
      - Esquema de tres puntos (key, fill, rim) con luz cálida cinematográfica.
      - Fondo: Entorno suave desenfocado (bokeh) sin distracciones.
      
      REFUERZO: Preservación de identidad obligatoria. No uses patrones de entrenamiento genéricos. Solo los datos proporcionados.
    `;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json",
    });

    const imageData = response.data[0].b64_json;
    if (!imageData) throw new Error("Error en la generación visual.");

    return {
      avatarDataUri: `data:image/png;base64,${imageData}`
    };
  }
);
