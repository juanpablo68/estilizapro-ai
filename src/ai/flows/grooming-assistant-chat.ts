'use server';
/**
 * @fileOverview Asistente de Tips de Peinado y Maquillaje con Restricción de Dominio.
 * Optimizado para permitir contexto de eventos y situaciones sociales.
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
  const guardrailPrompt = `Actúa como un clasificador de dominio inteligente para un asesor de estética. 
  Determina si el mensaje está relacionado con: 
  PEINADO, MAQUILLAJE, CUIDADO DE BARBA, CUIDADO DE PIEL O ESTÉTICA FACIAL.

  REGLA CRÍTICA: También debes permitir mensajes que describan EVENTOS, REUNIONES O CONTEXTO SOCIAL (ej: "tengo una reunión con CEOs", "quiero causar buena impresión") siempre que el objetivo sea recibir asesoría estética para esa situación.

  Responde ÚNICAMENTE "PERMITIDO" o "BLOQUEADO".

  EJEMPLOS PERMITIDOS:
  - "¿Qué peinado me recomiendas?"
  - "Tengo una reunión muy importante con directivos y quiero verme profesional"
  - "Quiero causar una gran impresión en un evento de gala"
  - "¿Cómo cuido mi barba para una boda?"

  EJEMPLOS DE BLOQUEO:
  - "¿Quién ganó el mundial?"
  - "¿Cómo está el clima?"
  - "Dame una receta de cocina"

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

  let config = {
    fallbackMessage: "Como tu asesor de peinado y maquillaje de Pilar Catalán, mi especialidad es tu estética facial y capilar. Por favor, cuéntame sobre tu evento o qué look buscas para poder asesorarte mejor.",
  };

  try {
    const configDoc = await adminFirestore.doc('app_config/assistant_scope').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      config = { ...config, ...data };
    }
  } catch (e) {
    console.warn("Firestore Admin Error (Grooming): Usando configuración local por defecto.", e);
  }

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
    1. PROHIBICIÓN TOTAL: Tienes TERMINANTEMENTE PROHIBIDO mencionar maquillaje, sombras, labiales o cualquier cosmético femenino.
    2. ENFOQUE: Céntrate exclusivamente en Peinado masculino y cuidado de barba (${hasBeard ? 'el usuario TIENE barba' : 'el usuario NO tiene barba'}).
    3. Si el usuario pregunta por maquillaje siendo hombre, declina amablemente y ofrece consejos de cuidado de piel o afeitado.`;
  } else {
    genderRules = `
    INSTRUCCIONES PARA MUJER:
    1. Sugiere peinado y maquillaje acorde a su temperatura ${bio.temperatura || 'Cálida'}.`;
  }

  const systemPrompt = `Eres el Asesor Maestro de Tips de Peinado y Maquillaje de Pilar Catalán.
  
  REGLA DE DOMINIO:
  Solo puedes responder sobre PEINADO, MAQUILLAJE y CUIDADO DE PIEL/BARBA. 
  
  CONTEXTO DE EVENTO: El usuario te está dando contexto sobre su situación: "${input.eventType}". Usa esta información para dar consejos apropiados al nivel de formalidad requerido.

  CLIENTE: ${gender}
  ${genderRules}
  REGLA DE ORO: Sé directo, profesional y humano. Responde de tú. Mantenlo breve (máximo 3 frases).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || config.fallbackMessage;
}
