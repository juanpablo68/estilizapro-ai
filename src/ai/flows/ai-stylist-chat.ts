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
  
  TU MEMORIA SOBRE EL USUARIO (DATOS REALES):
  - BIOMETRÍA:
    * Piel: ${input.userContext?.colorimetry || 'No analizada'}
    * Ojos: ${bio.rostro?.ojos?.color_detalle || 'No definido'}
    * Cabello: ${bio.rostro?.cabello?.color_natural || 'No definido'}
    * Silueta: ${input.userContext?.figure || 'No analizada'}
  
  - PREFERENCIAS:
    * Estilos: ${input.userContext?.preferences || 'No definidos'}
    * Resaltar: ${input.userContext?.accentuate || 'No definido'}
    * Disimular: ${input.userContext?.minimize || 'No definido'}
  
  - BASE DE CONOCIMIENTO (REGLAS MAESTRAS):
  ${input.userContext?.knowledgeBase || 'Seguir tendencias de Pilar Cifuentes.'}
  
  INSTRUCCIONES DE COMPORTAMIENTO:
  1. Ya conoces al usuario. No hagas preguntas básicas sobre su cuerpo o colores si ya están arriba.
  2. Tus recomendaciones deben ser 100% coherentes con su silueta y colorimetría.
  3. Usa un tono cercano, experto e inspirador. 
  4. Si el usuario pregunta algo que contradice su base de conocimiento, adviértele amablemente siguiendo las reglas de Pilar.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
