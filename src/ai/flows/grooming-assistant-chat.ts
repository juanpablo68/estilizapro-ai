'use server';
/**
 * @fileOverview Chat de Visagismo con cumplimiento estricto de género y peinado.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';

const GroomingChatInputSchema = z.object({
  message: z.string(),
  eventType: z.string(),
  userContext: z.object({
    biometricData: z.any().optional(),
    colorimetry: z.string().optional(),
    hasBeard: z.boolean().optional(),
    gender: z.string().optional(),
  }).optional(),
  openaiApiKey: z.string().optional(),
});

export async function chatWithGroomingAssistant(input: z.infer<typeof GroomingChatInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const bio = input.userContext?.biometricData || {};
  const gender = input.userContext?.gender || bio.genero || 'Femenino';
  const skin = bio.colorimetria?.tono_piel || 'natural';
  const hairColor = bio.rostro?.cabello?.color_natural || 'natural';
  const hasBeard = input.userContext?.hasBeard || false;

  let rules = "";
  if (gender === 'Masculino') {
    rules = `
    REGLAS MASCULINAS:
    1. PROHIBIDO: No menciones maquillaje, sombras, labiales ni polvos.
    2. OBLIGATORIO: Recomienda un estilo de PEINADO o CORTE de cabello (ej: fade, clásico, tupé).
    3. PIEL: Sugiere cuidado (hidratación o limpieza).
    4. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere cómo arreglarla.`;
  } else {
    rules = `
    REGLAS FEMENINAS:
    1. OBLIGATORIO: Sugiere técnica de maquillaje y colores.
    2. OBLIGATORIO: Sugiere un PEINADO (ej: ondas, recogido, liso).`;
  }

  const systemPrompt = `Eres el Director de Visagismo de Pilar Cifuentes.
  
  CONTEXTO:
  - Usuario: ${gender}
  - Evento: ${input.eventType}
  - Rasgos: Cabello ${hairColor}, Piel ${skin}
  
  ${rules}

  PERSONALIDAD: Experto, directo, habla de tú. Máximo 2 párrafos cortos. 
  IMPORTANTE: Siempre debes cubrir tanto el CABELLO como el ROSTRO.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo de peinado y rostro buscamos hoy?";
}
