
'use server';
/**
 * @fileOverview Chat interactivo sintetizado y humano.
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
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const bio = input.userContext?.biometricData || {};
  const eyes = bio.rostro?.ojos?.color_detalle || 'natural';
  const temp = bio.temperatura || 'Cálida';
  const figure = bio.cuerpo?.figure_geometrica || 'Reloj de Arena';

  const systemPrompt = `Eres el asesor personal de imagen de Pilar Cifuentes. 
  
  REGLAS DE PERSONALIDAD:
  1. No suenes como una IA. Habla de tú a tú, como un amigo experto en moda.
  2. Sé sintetizado. No des explicaciones largas a menos que te lo pidan. Ve al grano.
  3. Usa la memoria del usuario: Ojos ${eyes}, Temperatura ${temp}, Figura ${figure}.
  4. Si preguntan por colores, recomiéndalos basándote en su temperatura ${temp}.
  
  CONTEXTO DE ESTILO:
  - Estilos: ${input.userContext?.preferences || 'No definidos'}
  - Áreas a resaltar: ${input.userContext?.accentuate || 'No definidas'}
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
