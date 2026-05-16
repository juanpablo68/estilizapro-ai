'use server';
/**
 * @fileOverview Chat especializado en Visagismo.
 * Asegura recomendaciones de peinado y piel según género.
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

  let rules = "";
  if (gender === 'Masculino') {
    rules = `
    ESTILO MASCULINO (GROOMING):
    1. PROHIBIDO: No menciones sombras de ojos, labiales, delineadores ni ningún tipo de maquillaje femenino.
    2. OBLIGATORIO: Sugiere un tipo de peinado masculino profesional acorde al evento.
    3. PIEL: Sugiere hidratación o control de brillo.
    4. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere arreglo o afeitado acorde.`;
  } else {
    rules = `
    VISAGISMO FEMENINO:
    1. OBLIGATORIO: Sugiere una técnica de maquillaje (ojos/labios) acorde a su temperatura ${temp}.
    2. OBLIGATORIO: Sugiere un estilo de peinado femenino (recogido, ondas, liso) para el evento.`;
  }

  const systemPrompt = `Eres el Director de Visagismo de Pilar Cifuentes.
  
  USUARIO:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Rasgos: Pelo ${hairColor}, Piel ${skin} (${temp})
  
  ${rules}

  PERSONALIDAD:
  - Habla de tú, de forma humana y directa. Máximo 2 párrafos cortos.
  - Asegúrate de cubrir SIEMPRE tanto el CABELLO (peinado) como el ROSTRO (piel/maquillaje según género).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo buscamos para tu cabello y piel hoy?";
}
