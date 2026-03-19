'use server';
/**
 * @fileOverview Chat interactivo con el Asistente Estilista utilizando Gemini Flash Lite.
 */

import { getGenkitEngine } from '@/ai/genkit';
import { z } from 'genkit';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
    figure: z.string().optional(),
    colorimetry: z.string().optional(),
    preferences: z.string().optional(),
  }).optional(),
  geminiApiKey: z.string().optional(),
});

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const { ai, model } = getGenkitEngine(input.geminiApiKey);

  const { text } = await ai.generate({
    model: model,
    prompt: `Eres el asistente experto de Pilar Cifuentes Catalán.
    
    CONTEXTO:
    - Figura: ${input.userContext?.figure || 'No analizada'}
    - Colorimetría: ${input.userContext?.colorimetry || 'No analizada'}
    - Estilos: ${input.userContext?.preferences || 'Generales'}
    
    Responde de forma profesional, amable e inspiradora.
    
    PREGUNTA DEL USUARIO: ${input.message}`,
  });
  return text;
}
