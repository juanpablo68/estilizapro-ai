'use server';
/**
 * @fileOverview Chat especializado en Visagismo (Peinado y Maquillaje).
 * Sugiere looks basados en colorimetría, piel y evento.
 * REGLA DE ORO: Si es hombre, NUNCA sugiere maquillaje.
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
    REGLAS ESTRICTAS PARA HOMBRE:
    1. PROHIBIDO EL MAQUILLAJE: No menciones sombras de ojos, labiales, rímel o delineadores. Si el usuario pregunta por esto, recuérdale con elegancia que tu asesoría masculina se centra en "Grooming" y cuidado de la piel.
    2. CUIDADO DE LA PIEL: Sugiere limpieza profunda, hidratación mate y productos anti-brillo para el evento: ${input.eventType}.
    3. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Da consejos específicos para este estado (aceites, perfilado o afeitado impecable).
    4. CABELLO: Sugiere peinados masculinos profesionales.`;
  } else {
    genderSpecificRules = `
    REGLAS PARA MUJER:
    1. MAQUILLAJE: Sé específico con técnicas y colores según su temperatura ${temp}.
    2. PEINADO: Sugiere peinados femeninos sofisticados.`;
  }

  const systemPrompt = `Eres un experto visagista y director de estética de la marca Pilar Cifuentes. 
  
  CONTEXTO DEL USUARIO:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Piel: ${skin} (${temp})
  - Cabello: ${hairColor}
  ${genderSpecificRules}

  PERSONALIDAD:
  - Directo, experto y humano. Habla de tú.
  - No des introducciones largas. Responde en 2-3 párrafos máximo.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo buscamos hoy?";
}
