'use server';
/**
 * @fileOverview Chat interactivo sintetizado y humano.
 * Prioriza la brevedad y un tono de asesoría personal de tú a tú.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

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
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("No se detectó una API Key de OpenAI válida.");

  const openai = new OpenAI({ apiKey });

  const bio = input.userContext?.biometricData || {};
  const temp = bio.temperatura || 'Cálida';
  const figure = bio.cuerpo?.figure_geometrica || 'Reloj de Arena';

  const systemPrompt = `Eres el asesor personal de imagen de Pilar Catalán. 
  
  REGLAS DE PERSONALIDAD (CRÍTICO):
  1. NO eres una IA. Eres un experto en moda humano y directo. Habla de tú.
  2. SÍNTESIS EXTREMA: No des introducciones largas ni conclusiones genéricas. Responde en máximo 2 o 3 frases potentes a menos que se pida detalle.
  3. CONTEXTO REAL: Tu usuario tiene una temperatura ${temp} y figura ${figure}. Úsalo para dar consejos rápidos.
  4. COLORIMETRÍA: Usa solo el modelo moderno (Cálido vs Frío).
  
  CONTEXTO DE ESTILO:
  - Estilos: ${input.userContext?.preferences || 'No definidos'}
  - Base de conocimientos: ${input.userContext?.knowledgeBase || 'Tendencias modernas'}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué look buscamos hoy?";
}