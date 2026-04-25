
'use server';
/**
 * @fileOverview Chat especializado en Visagismo (Peinado y Maquillaje).
 * Sugiere looks basados en colorimetría, piel y evento.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const GroomingChatInputSchema = z.object({
  message: z.string(),
  eventType: z.string(),
  userContext: z.object({
    biometricData: z.any().optional(),
    colorimetry: z.string().optional(),
  }).optional(),
  openaiApiKey: z.string().optional(),
});

export async function chatWithGroomingAssistant(input: z.infer<typeof GroomingChatInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const bio = input.userContext?.biometricData || {};
  const skin = bio.colorimetria?.tono_piel || 'natural';
  const temp = input.userContext?.colorimetry || 'Cálida';
  const hairColor = bio.rostro?.cabello?.color_natural || 'natural';

  const systemPrompt = `Eres un experto visagista y maquillador profesional. 
  
  CONTEXTO DEL USUARIO:
  - Evento: ${input.eventType}
  - Tono de piel: ${skin}
  - Temperatura: ${temp}
  - Color de cabello: ${hairColor}

  REGLAS:
  1. Tono humano y profesional. Habla de tú.
  2. Sé específico con técnicas de maquillaje (ej: ahumado, nude, labios marcados) y tipos de peinado (ej: ondas al agua, recogido pulido).
  3. Adapta siempre la intensidad al evento: ${input.eventType}.
  4. Sé breve y directo.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo de maquillaje o peinado tienes en mente?";
}
