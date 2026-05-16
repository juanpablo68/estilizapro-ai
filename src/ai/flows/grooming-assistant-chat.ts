'use server';
/**
 * @fileOverview Asistente de Visagismo con lógica de género blindada y enfoque integral.
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
    1. PROHIBICIÓN ABSOLUTA: Tienes terminantemente prohibido mencionar maquillaje, sombras, delineadores, labiales, bases de color o máscaras de pestañas. No uses lenguaje femenino.
    2. ENFOQUE CABELLO: Sugiere siempre un peinado o corte masculino (ej: pompadour, rapado lateral, estilo clásico hacia atrás).
    3. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere cómo arreglarla, recortarla o hidratarla.
    4. CUIDADO DE PIEL: Recomienda solo limpieza, exfoliación suave o hidratación mate para evitar brillos.`;
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

  PERSONALIDAD: Profesional, experto, humano y directo. Habla de tú. 
  REGLA DE RESPUESTA: Debes incluir SIEMPRE una recomendación detallada para el CABELLO y otra para el ROSTRO (o barba si aplica). Máximo 2 párrafos.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.message }
      ]
    });

    return response.choices[0].message.content || "Como tu asesor, necesito que me digas qué efecto quieres lograr hoy.";
  } catch (error: any) {
    console.error("Grooming Chat Error:", error);
    throw new Error("El asistente no pudo procesar tu consulta.");
  }
}
