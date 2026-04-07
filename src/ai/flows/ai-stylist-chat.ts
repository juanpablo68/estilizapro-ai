
'use server';
/**
 * @fileOverview Chat interactivo con el Asistente de Vestuario con Memoria Total.
 * Utiliza el diagnóstico quirúrgico y las preferencias del usuario para cada respuesta.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
    biometricData: z.any().optional(),
    figure: z.string().optional(),
    colorimetry: z.string().optional(),
    preferences: z.string().optional(),
    accentuate: z.string().optional(),
    minimize: z.string().optional(),
    knowledgeBase: z.string().optional(),
  }).optional(),
  openaiApiKey: z.string().optional(),
});

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el chat.");

  const openai = new OpenAI({ apiKey });

  // Extracción profunda y segura de la memoria biométrica
  const bio = input.userContext?.biometricData || {};
  
  // Intentamos obtener valores de la estructura anidada o de las strings simplificadas
  const getBio = (obj: any, keys: string[], fallback: string) => {
    let curr = obj;
    for (const k of keys) {
      if (curr && curr[k]) curr = curr[k];
      else return fallback;
    }
    return typeof curr === 'string' ? curr : fallback;
  };

  const piel = getBio(bio, ['colorimetria', 'tono_piel'], 'No analizado');
  const subtono = getBio(bio, ['colorimetria', 'subtono'], 'No analizado');
  const ojos = getBio(bio, ['rostro', 'ojos', 'color_detalle'], 'No analizado');
  const cabello = getBio(bio, ['rostro', 'cabello', 'color_natural'], 'No analizado');
  const estacion = getBio(bio, ['colorimetria', 'estacion_sugerida'], 'No analizado');
  const figura = getBio(bio, ['cuerpo', 'figura_geometrica'], input.userContext?.figure || 'No analizado');

  const systemPrompt = `Eres el "Asistente de Vestuario" de PILAR CIFUENTES. 
  
  TIENES ACCESO A LA MEMORIA BIOMÉTRICA DEL USUARIO. SIEMPRE USA ESTOS DATOS:
  
  - Tono de Piel: ${piel} (Subtono: ${subtono})
  - Color de Ojos: ${ojos}
  - Color de Cabello: ${cabello}
  - Estación de Color: ${estacion}
  - Figura Corporal: ${figura}
  
  CONTEXTO ADICIONAL:
  - Estilos favoritos: ${input.userContext?.preferences || 'No definidos'}
  - Áreas a resaltar: ${input.userContext?.accentuate || 'No definidas'}
  - Áreas a disimular: ${input.userContext?.minimize || 'No definidas'}
  - Reglas de Estilo: ${input.userContext?.knowledgeBase || 'Seguir tendencias modernas'}

  INSTRUCCIONES:
  1. Si el usuario te pregunta por sus ojos, cabello o piel, RESPONDE usando los datos específicos arriba. NO digas que no los tienes.
  2. Tus consejos deben ser coherentes con su Estación (${estacion}) y su Figura (${figura}).
  3. Mantén un tono lujoso, asertivo y profesional.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
