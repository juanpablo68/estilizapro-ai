
'use server';
/**
 * @fileOverview Asistente de Visagismo con lógica de género blindada.
 * Asegura recomendación de cabello y prohíbe maquillaje en hombres.
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
    1. PROHIBICIÓN TOTAL: Tienes terminantemente prohibido mencionar maquillaje, sombras, labiales, rímel o cosméticos de color.
    2. ENFOQUE CABELLO Y BARBA: Debes sugerir siempre un estilo de peinado masculino y cuidado de la barba (${hasBeard ? 'el usuario tiene barba' : 'el usuario no tiene barba'}).
    3. PIEL: Recomienda solo limpieza e hidratación para evitar brillos en cámara.`;
  } else {
    genderRules = `
    INSTRUCCIONES PARA MUJER:
    1. CABELLO Y MAQUILLAJE: Sugiere peinado y paleta de colores para el rostro acorde a su temperatura ${bio.temperatura || 'Cálida/Fría'}.`;
  }

  const systemPrompt = `Eres el Director Maestro de Visagismo de Pilar Cifuentes Catalán.
  
  CONTEXTO:
  - Cliente: ${gender}
  - Evento: ${input.eventType}
  - Rasgos: Cabello ${hairColor}, Piel ${skin}
  
  ${genderRules}

  REGLA DE ORO: Debes dar SIEMPRE una recomendación específica para el CABELLO y otra para la PIEL/ROSTRO. Máximo 2 párrafos cortos.`;

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
