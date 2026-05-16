'use server';
/**
 * @fileOverview Chat especializado en Visagismo con coherencia de género absoluta.
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
  }).optional(),
  openaiApiKey: z.string().optional(),
});

export async function chatWithGroomingAssistant(input: z.infer<typeof GroomingChatInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const bio = input.userContext?.biometricData || {};
  const gender = bio.genero || 'Femenino';
  const skin = bio.colorimetria?.tono_piel || 'natural';
  const temp = input.userContext?.colorimetry || 'Cálida';
  const hairColor = bio.rostro?.cabello?.color_natural || 'natural';
  const hasBeard = input.userContext?.hasBeard || false;

  let genderRules = "";
  if (gender === 'Masculino') {
    genderRules = `
    ESTILO MASCULINO (GROOMING):
    1. PROHIBIDO: No menciones maquillaje (sombras, labiales, etc.).
    2. OBLIGATORIO: Sugiere un tipo de peinado masculino profesional (ej: fade, undercut, clásico) para el evento.
    3. PIEL: Sugiere cuidado básico (hidratación, control de grasa).
    4. BARBA: El usuario ${hasBeard ? 'SÍ TIENE' : 'NO TIENE'} barba. Sugiere arreglo o afeitado acorde.`;
  } else {
    genderRules = `
    VISAGISMO FEMENINO:
    1. OBLIGATORIO: Sugiere técnica de maquillaje para su temperatura ${temp}.
    2. OBLIGATORIO: Sugiere peinado (ondas, recogido, liso) para el evento.`;
  }

  const systemPrompt = `Eres el Director de Visagismo de Pilar Cifuentes.
  
  CONTEXTO USUARIO:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Rasgos: Pelo ${hairColor}, Piel ${skin}
  
  ${genderRules}

  REGLA DE ORO: Siempre debes cubrir CABELLO/PEINADO y ROSTRO (Piel/Grooming).
  PERSONALIDAD: Directo, experto, habla de tú. Máximo 2 párrafos cortos.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué look de peinado y rostro buscamos hoy?";
}
