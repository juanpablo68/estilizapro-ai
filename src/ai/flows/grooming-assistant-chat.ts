'use server';
/**
 * @fileOverview Asistente de Visagismo con lógica de género blindada.
 * Prohíbe maquillaje en hombres y asegura recomendación de cabello.
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
  const hasBeard = input.userContext?.hasBeard ?? false;

  let genderRules = "";
  if (gender === 'Masculino') {
    genderRules = `
    INSTRUCCIONES CRÍTICAS PARA HOMBRE:
    1. PROHIBICIÓN ABSOLUTA: Tienes terminantemente prohibido mencionar maquillaje, sombras, labiales o cualquier cosmético de color. No uses lenguaje femenino.
    2. ENFOQUE CABELLO: Sugiere siempre un peinado masculino (ej: pompadour, estilo clásico, degradado) ideal para el evento ${input.eventType}.
    3. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Da consejos específicos para su mantenimiento o afeitado impecable.
    4. PIEL: Limítate a limpieza facial e hidratación mate para evitar brillos.`;
  } else {
    genderRules = `
    INSTRUCCIONES PARA MUJER:
    1. CABELLO: Sugiere un peinado (ondas, recogido, liso) ideal para el evento.
    2. MAQUILLAJE: Sugiere una paleta de colores acorde a su temperatura ${bio.temperatura || 'Cálida/Fría'}.`;
  }

  const systemPrompt = `Eres el Director Maestro de Visagismo de Pilar Cifuentes Catalán.
  
  PERFIL DEL CLIENTE:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Rasgos: Cabello ${hairColor}, Piel ${skin}
  
  ${genderRules}

  PERSONALIDAD: Profesional, experto y directo. Habla de tú. 
  REGLA DE RESPUESTA: Debes incluir SIEMPRE una recomendación para el CABELLO y otra para el ROSTRO (piel/barba). Máximo 2 párrafos.`;

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
