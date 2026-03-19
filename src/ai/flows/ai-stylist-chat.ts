'use server';
/**
 * @fileOverview Chat interactivo con el Asistente Estilista utilizando OpenAI GPT-4o.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
    figure: z.string().optional(),
    colorimetry: z.string().optional(),
    preferences: z.string().optional(),
  }).optional(),
  openaiApiKey: z.string().optional(),
});

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el chat.");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Eres el asistente experto de Pilar Cifuentes Catalán. 
        CONTEXTO DEL USUARIO:
        - Figura: ${input.userContext?.figure || 'No analizada'}
        - Colorimetría: ${input.userContext?.colorimetry || 'No analizada'}
        - Estilos: ${input.userContext?.preferences || 'Generales'}
        Responde de forma profesional, amable e inspiradora.`
      },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
