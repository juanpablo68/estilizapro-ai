'use server';
/**
 * @fileOverview Asistente de Visagismo con lógica de género inquebrantable.
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

  let rules = "";
  if (gender === 'Masculino') {
    rules = `
    INSTRUCCIONES CRÍTICAS PARA HOMBRE:
    1. PROHIBICIÓN ABSOLUTA: No menciones maquillaje, sombras, delineadores, labiales ni correctores de color.
    2. ENFOQUE OBLIGATORIO: Debes recomendar un estilo de PEINADO o CORTE de cabello (ej: pompadour, liso hacia atrás, fade).
    3. BARBA: El usuario ${hasBeard ? 'TIENE' : 'NO TIENE'} barba. Sugiere cómo definirla o cuidarla según el caso.
    4. CUIDADO DE PIEL: Recomienda solo limpieza, hidratación o control de brillo.`;
  } else {
    rules = `
    INSTRUCCIONES PARA MUJER:
    1. CABELLO: Sugiere un peinado (ondas, liso, recogido) acorde al evento.
    2. MAQUILLAJE: Sugiere técnicas y colores según su colorimetría fría/cálida.`;
  }

  const systemPrompt = `Eres el Director Maestro de Visagismo de Pilar Cifuentes Catalán.
  
  PERFIL DEL CLIENTE:
  - Género: ${gender}
  - Evento: ${input.eventType}
  - Rasgos: Cabello ${hairColor}, Piel ${skin}
  
  ${rules}

  PERSONALIDAD: Profesional, experto, humano y directo. Habla de tú. Máximo 2 párrafos. 
  DEBES cubrir siempre el CABELLO y el ROSTRO/BARBA de forma equilibrada.`;

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
    throw new Error("El asistente no pudo procesar tu consulta estática.");
  }
}
