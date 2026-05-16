'use server';
/**
 * @fileOverview Asistente de Visagismo con lógica de género blindada.
 * PROHIBICIÓN TOTAL de maquillaje para hombres.
 * ENFOQUE OBLIGATORIO en peinado y barba para hombres.
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
    INSTRUCCIONES CRÍTICAS PARA HOMBRE (REGLAS DE ORO):
    1. PROHIBICIÓN TOTAL: Tienes terminantemente prohibido mencionar maquillaje, sombras, labiales, bases de color o delineadores.
    2. PEINADO OBLIGATORIO: Debes recomendar siempre un estilo de peinado masculino moderno (ej: Slick Back, Fade, Undercut).
    3. BARBA: El usuario ${hasBeard ? 'TIENE barba' : 'NO tiene barba'}. Da consejos específicos (perfilado, hidratación o afeitado impecable).
    4. PIEL: Solo cuidado dermatológico básico (limpieza e hidratación mate).
    REGLA: Divide tu respuesta en "ESTILO DE PEINADO Y BARBA" y "CUIDADO DE PIEL".`;
  } else {
    genderRules = `
    INSTRUCCIONES PARA MUJER:
    1. Sugiere peinado y maquillaje acorde a su temperatura ${bio.temperatura || 'Cálida'}.
    REGLA: Divide tu respuesta en "PEINADO" y "MAQUILLAJE".`;
  }

  const systemPrompt = `Eres el Director Maestro de Visagismo de Pilar Cifuentes Catalán.
  CLIENTE: ${gender} | EVENTO: ${input.eventType} | COLORIMETRÍA: ${bio.temperatura || 'Cálida'}
  ${genderRules}
  REGLA DE ORO: Sé directo, profesional y humano. Responde de tú.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.message }
      ]
    });

    return response.choices[0].message.content || "Como tu asesor, dime qué efecto quieres lograr hoy.";
  } catch (error: any) {
    console.error("Grooming Chat Error:", error);
    throw new Error("El asistente no pudo procesar tu consulta.");
  }
}
