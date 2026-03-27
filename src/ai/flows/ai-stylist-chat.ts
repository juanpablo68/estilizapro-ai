'use server';
/**
 * @fileOverview Chat interactivo con el Asistente de Vestuario con Memoria Total.
 * Integra biometría, preferencias de onboarding y base de conocimiento.
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

  const bio = input.userContext?.biometricData || {};
  
  const systemPrompt = `Eres el "Asistente de Vestuario" oficial de PILAR CIFUENTES. 
  
  TU MEMORIA INTEGRAL SOBRE EL USUARIO:
  - DIAGNÓSTICO BIOMÉTRICO (FOTOS REALES):
    * Estación/Colorimetría: ${input.userContext?.colorimetry || 'No analizada'}
    * Piel: ${bio.colorimetria?.tono_piel || 'No definido'} (Subtono: ${bio.colorimetria?.subtono || 'No definido'})
    * OJOS: ${bio.rostro?.ojos?.color_detalle || 'No definido'} (Forma: ${bio.rostro?.ojos?.forma || 'No definida'})
    * CABELLO: ${bio.rostro?.cabello?.color_natural || 'No definido'} (Textura: ${bio.rostro?.cabello?.textura || 'No definida'})
    * SILUETA: ${input.userContext?.figure || 'No analizada'}
    * Contraste Facial: ${bio.colorimetria?.contraste_facial || 'No definido'}
  
  - PREFERENCIAS DEL USUARIO:
    * Estilos Favoritos: ${input.userContext?.preferences || 'No definidos'}
    * Resaltar: ${input.userContext?.accentuate || 'No definido'}
    * Disimular: ${input.userContext?.minimize || 'No definido'}
  
  - REGLAS MAESTRAS (BASE DE CONOCIMIENTO):
  ${input.userContext?.knowledgeBase || 'Seguir tendencias de Pilar Cifuentes.'}
  
  INSTRUCCIONES DE COMPORTAMIENTO:
  1. No digas "no tengo registro" de los datos arriba mencionados. Úsalos para personalizar cada consejo.
  2. Si el usuario pregunta por colores que le quedan bien, basa tu respuesta en su Estación Sugerida y matiz de ojos/cabello.
  3. Si pregunta por prendas, considera su Silueta y lo que desea resaltar/disimular.
  4. Mantén un tono experto, cercano y siempre coherente con el diagnóstico de Pilar Cifuentes.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
