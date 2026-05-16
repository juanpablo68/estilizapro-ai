'use server';
/**
 * @fileOverview Chat especializado en Visagismo.
 * REGLA DE ORO: Debe incluir SIEMPRE peinado y piel.
 * Si es hombre, prohibido maquillaje.
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

  let genderSpecificRules = "";
  if (gender === 'Masculino') {
    genderSpecificRules = `
    REGLAS ESTRICTAS PARA HOMBRE (MAESTRO GROOMING):
    1. PROHIBIDO EL MAQUILLAJE: No menciones sombras, labiales o delineadores.
    2. PIEL Y CABELLO: Es OBLIGATORIO dar un consejo de cuidado de piel Y un estilo de peinado masculino profesional.
    3. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere mantenimiento o afeitado.`;
  } else {
    genderSpecificRules = `
    REGLAS PARA MUJER (VISAGISMO):
    1. MAQUILLAJE Y PEINADO: Es OBLIGATORIO sugerir técnica de maquillaje Y un estilo de peinado femenino acorde al evento.`;
  }

  const systemPrompt = `Eres el Director de Estética de Pilar Cifuentes. Experto en Visagismo.
  
  CONTEXTO:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Tono de Piel: ${skin} (${temp})
  - Pelo: ${hairColor}
  ${genderSpecificRules}

  PERSONALIDAD:
  - Humano, directo y conciso. Máximo 2 párrafos cortos. Habla de tú.
  - Asegúrate de cubrir tanto el rostro (piel/maquillaje) como el cabello (peinado).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo de peinado y estética buscamos hoy?";
}
