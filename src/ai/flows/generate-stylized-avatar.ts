
'use server';
/**
 * @fileOverview FASE 2: Generación de Avatar 3D Pixar de alta fidelidad utilizando DALL-E 3.
 * Modificado para asegurar renderizado de CUERPO COMPLETO (Full Body).
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
    const bio = input.biometricData || {};

    // Función de ayuda para evitar errores de 'undefined' durante la construcción del prompt
    const g = (path: string, defaultValue = 'no especificado') => {
      const parts = path.split('.');
      let current: any = bio;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return defaultValue;
        }
      }
      return current || defaultValue;
    };

    // Construcción del prompt maestro basado en el análisis de FASE 1
    // REFORZADO PARA CUERPO COMPLETO
    const finalPrompt = `
      FASE 2 — GENERACIÓN DE AVATAR 3D PIXAR (CUERPO COMPLETO):
      Usando EXCLUSIVAMENTE estos datos biométricos reales: ${JSON.stringify(bio)}.
      
      REGLAS CRÍTICAS DE GENERACIÓN:
      - TOMA DE CUERPO COMPLETO (FULL BODY SHOT): El personaje debe aparecer de cuerpo entero, de pies a cabeza, centrado en la imagen.
      - POSE: Pose de pie natural, brazos a los lados o ligeramente abiertos.
      - VESTIMENTA BASE: Ropa interior deportiva neutra o ropa ajustada minimalista (para permitir futuras pruebas de ropa).
      - Género: ${g('genero')}. Tono de piel EXACTO: ${g('tono_piel.categoria')} (${g('tono_piel.hex_aproximado')}).
      - Rostro: ${g('rostro.forma')}, ojos ${g('rostro.ojos.color')} (${g('rostro.ojos.forma')}), nariz ${g('rostro.nariz')}, labios ${g('rostro.labios')}.
      - Cabello: ${g('cabello.color')}, ${g('cabello.tipo')}, peinado ${g('cabello.peinado')}.
      - Cuerpo: ${g('cuerpo.complexion')}, hombros ${g('cuerpo.proporcion_hombros')}, cintura ${g('cuerpo.proporcion_cintura')}, caderas ${g('cuerpo.proporcion_cadera')}.
      
      ESTILO VISUAL:
      - Personaje 3D estilo Pixar/Disney de alta calidad, render cinematográfico profesional.
      - Subsurface scattering en piel, iluminación global suave, materiales físicamente realistas.
      - Estilización leve sin perder identidad real.
      
      CÁMARA E ILUMINACIÓN:
      - Plano general (Full Body), perspectiva de frente, lente 50mm.
      - Se deben ver CLARAMENTE los pies, las piernas y el torso completo.
      - Esquema de tres puntos con luz cálida.
      - Fondo: Entorno neutro suave desenfocado (bokeh) para no distraer.
      
      IMPORTANTE: No cortes la imagen en la cintura ni en las rodillas. Asegúrate de mostrar el calzado y la postura completa.
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
