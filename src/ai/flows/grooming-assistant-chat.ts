
'use server';
/**
 * @fileOverview Chat especializado en Visagismo (Peinado y Maquillaje).
 * Sugiere looks basados en colorimetría, piel y evento.
 * Incluye lógica restrictiva para cuidado masculino (piel y barba).
 */

import { z } from 'genkit';
import OpenAI from 'openai';

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
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
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
    REGLAS PARA HOMBRE:
    1. RESTRINGIR MAQUILLAJE: No sugieras maquillaje convencional. Enfócate exclusivamente en el cuidado de la piel, sugiriendo cremas anti-brillo o hidratantes ligeras si es necesario para evitar el exceso de grasa/brillo en cámara o eventos.
    2. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere recortes, perfilados o cuidados de hidratación para el vello facial (si tiene) o un afeitado pulcro (si no tiene).
    3. PEINADO: Sugiere cortes o peinados masculinos que complementen su tipo de rostro.`;
  } else {
    genderSpecificRules = `
    REGLAS PARA MUJER:
    1. MAQUILLAJE: Sé específico con técnicas (ahumado, nude, labios) y colores según su temperatura ${temp}.
    2. PEINADO: Sugiere peinados femeninos (ondas, recogidos, etc).`;
  }

  const systemPrompt = `Eres un experto visagista y maquillador profesional de la marca Pilar Cifuentes. 
  
  CONTEXTO DEL USUARIO:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Tono de piel: ${skin}
  - Temperatura: ${temp}
  - Color de cabello: ${hairColor}
  ${genderSpecificRules}

  REGLAS GENERALES:
  1. Tono humano y profesional. Habla de tú.
  2. Adapta siempre la intensidad al evento: ${input.eventType}.
  3. Sé breve y directo.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo de maquillaje o peinado tienes en mente?";
}
