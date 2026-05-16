'use server';
/**
 * @fileOverview Chat especializado en Visagismo (Peinado y Grooming).
 * Sugiere looks basados en género, colorimetría, piel y evento.
 * REGLA DE ORO: Si es hombre, PROHIBIDO sugerir maquillaje.
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
    1. PROHIBIDO EL MAQUILLAJE: Absolutamente prohibido mencionar sombras, labiales, rímel, colorete o delineadores. Si el usuario pregunta por maquillaje, aclara que tu asesoría masculina se enfoca en salud de la piel y estética de vello facial.
    2. CUIDADO DE LA PIEL: Sugiere limpieza profunda, hidratación con acabado mate y bálsamos labiales neutros (no labiales de color).
    3. BARBA Y VELLO: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere perfilado, aceites de barba o afeitado impecable según sea el caso.
    4. CABELLO: Sugiere estilos de peinado masculinos profesionales (pomadas, ceras mate, cortes clásicos).`;
  } else {
    genderSpecificRules = `
    REGLAS PARA MUJER (VISAGISMO):
    1. MAQUILLAJE: Sé específico con técnicas de ojos, labios y piel según su temperatura ${temp}.
    2. PEINADO: Sugiere peinados femeninos (ondas, recogidos, alisados) adecuados para el evento.`;
  }

  const systemPrompt = `Eres el Director de Estética de la marca Pilar Cifuentes. Tu especialidad es el Visagismo de alto nivel.
  
  CONTEXTO DEL USUARIO:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Tono de Piel: ${skin} (${temp})
  - Cabello Natural: ${hairColor}
  ${genderSpecificRules}

  PERSONALIDAD:
  - Experto, directo y humano. Habla de "tú".
  - Sé muy conciso. Responde en un máximo de 2 párrafos cortos.
  - No uses introducciones robóticas como "Como experto...".`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Dime, ¿qué estilo de imagen buscamos para hoy?";
}
