
'use server';
/**
 * @fileOverview Asistente de Visagismo con lógica de género blindada.
 * Prohíbe terminantemente el maquillaje en hombres y obliga a recomendar peinado y barba.
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
  const hasBeard = input.userContext?.hasBeard ?? false;

  let genderRules = "";
  if (gender === 'Masculino') {
    genderRules = `
    INSTRUCCIONES CRÍTICAS PARA HOMBRE (EL USUARIO ES HOMBRE):
    1. PROHIBICIÓN TOTAL: Tienes terminantemente prohibido mencionar maquillaje, sombras, delineadores, labiales, bases de color o cualquier producto cosmético.
    2. ENFOQUE CABELLO Y BARBA: Debes recomendar siempre un estilo de peinado masculino moderno (ej: Undercut, Pompadour, Texturizado). Es obligatorio recomendar el peinado.
    3. BARBA: El usuario ${hasBeard ? 'TIENE barba' : 'NO tiene barba'}. Da consejos específicos para este estado (ej: perfilado de barba, aceite para barba o afeitado clásico).
    4. PIEL: Recomienda solo rutinas de limpieza, exfoliación e hidratación efecto mate para la piel del hombre.
    REGLA: Tu respuesta DEBE dividirse en: "ESTILO DE CABELLO Y BARBA" y "CUIDADO DE PIEL".`;
  } else {
    genderRules = `
    INSTRUCCIONES PARA MUJER:
    1. CABELLO Y MAQUILLAJE: Sugiere un peinado elegante y una paleta de maquillaje acorde a su temperatura ${bio.temperatura || 'Cálida'}.
    REGLA: Tu respuesta DEBE tener una sección de "PEINADO" y otra de "MAQUILLAJE".`;
  }

  const systemPrompt = `Eres el Director Maestro de Visagismo de Pilar Cifuentes Catalán.
  
  DATOS DEL CLIENTE:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Colorimetría: ${bio.temperatura || 'Cálida'}
  
  ${genderRules}

  REGLA DE ORO: Sé directo, profesional y humano. No uses introducciones largas. Responde de tú.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.message }
      ]
    });

    return response.choices[0].message.content || "Como tu asesor experto, dime qué efecto quieres lograr hoy.";
  } catch (error: any) {
    console.error("Grooming Chat Error:", error);
    throw new Error("El asistente no pudo procesar tu consulta.");
  }
}
