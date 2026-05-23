
'use server';
/**
 * @fileOverview Asistente de Tips de Peinado y Maquillaje con Restricción de Dominio.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminFirestore } from '@/lib/firebase-admin';

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

async function checkGroomingDomain(openai: OpenAI, message: string): Promise<boolean> {
  const guardrailPrompt = `Actúa como un clasificador de dominio. Determina si el mensaje está relacionado con: 
  PEINADO, MAQUILLAJE, CUIDADO DE BARBA, CUIDADO DE PIEL O ESTÉTICA FACIAL.

  Responde ÚNICAMENTE "PERMITIDO" o "BLOQUEADO".

  EJEMPLOS DE BLOQUEO:
  - "¿Quién ganó el mundial?"
  - "¿Cómo está el clima?"
  - "Dame una receta de cocina"

  EJEMPLOS PERMITIDOS:
  - "¿Qué peinado me recomiendas?"
  - "¿Cómo cuido mi barba?"
  - "¿Qué maquillaje combina con mi piel?"

  MENSAJE: "${message}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: guardrailPrompt }],
    temperature: 0,
    max_tokens: 5,
  });

  return response.choices[0].message.content?.trim().toUpperCase() === "PERMITIDO";
}

export async function chatWithGroomingAssistant(input: z.infer<typeof GroomingChatInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  // 1. Cargar Configuración
  const configDoc = await adminFirestore.doc('app_config/assistant_scope/main').get();
  const config = configDoc.exists ? configDoc.data() : {
    fallbackMessage: "Como tu asesor de peinado y maquillaje de Pilar Catalán, mi especialidad es tu estética facial y capilar. No puedo ayudarte con temas fuera de ese ámbito.",
  };

  // 2. Guardrail
  const isAllowed = await checkGroomingDomain(openai, input.message);
  if (!isAllowed) {
    return config.fallbackMessage;
  }

  const bio = input.userContext?.biometricData || {};
  const gender = input.userContext?.gender || bio.genero || 'Femenino';
  const hasBeard = input.userContext?.hasBeard ?? false;

  let genderRules = "";
  if (gender === 'Masculino') {
    genderRules = `
    INSTRUCCIONES CRÍTICAS PARA HOMBRE:
    1. PROHIBICIÓN TOTAL: Tienes prohibido mencionar maquillaje, sombras o labiales.
    2. ENFOQUE: Peinado masculino y cuidado de barba (${hasBeard ? 'TIENE barba' : 'NO tiene barba'}).`;
  } else {
    genderRules = `
    INSTRUCCIONES PARA MUJER:
    1. Sugiere peinado y maquillaje acorde a su temperatura ${bio.temperatura || 'Cálida'}.`;
  }

  const systemPrompt = `Eres el Asesor Maestro de Tips de Peinado y Maquillaje de Pilar Catalán.
  
  REGLA DE DOMINIO:
  Solo puedes responder sobre PEINADO, MAQUILLAJE y CUIDADO DE PIEL/BARBA. 
  Cualquier otro tema (historia, ciencia, política, etc.) debe ser rechazado.

  CLIENTE: ${gender} | EVENTO: ${input.eventType}
  ${genderRules}
  REGLA DE ORO: Sé directo, profesional y humano. Responde de tú.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || config.fallbackMessage;
}
