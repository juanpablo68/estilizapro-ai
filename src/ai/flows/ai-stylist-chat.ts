
'use server';
/**
 * @fileOverview Chat interactivo con el Asistente de Vestuario utilizando OpenAI GPT-4o.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
    figure: z.string().optional(),
    colorimetry: z.string().optional(),
    preferences: z.string().optional(),
    knowledgeBase: z.string().optional(),
  }).optional(),
  openaiApiKey: z.string().optional(),
});

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el chat.");

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `Eres el "Asistente de Vestuario" oficial de PILAR CIFUENTES. 
  
  CONTEXTO DEL USUARIO:
  - Figura: ${input.userContext?.figure || 'No analizada'}
  - Colorimetría: ${input.userContext?.colorimetry || 'No analizada'}
  - Estilos Preferidos: ${input.userContext?.preferences || 'Generales'}
  
  BASE DE CONOCIMIENTO MAESTRA:
  ${input.userContext?.knowledgeBase || 'No hay guías específicas cargadas.'}
  
  INSTRUCCIONES:
  Responde de forma profesional, amable e inspiradora. Tu objetivo es ser la mano derecha de Pilar Cifuentes en el asesoramiento del usuario. Utiliza la BASE DE CONOCIMIENTO como tu guía principal de estilo para todas las recomendaciones.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
