'use server';
/**
 * @fileOverview Chat interactivo con Restricción de Dominio (Guardrail).
 * Optimizado para permitir contexto de eventos y situaciones sociales.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminFirestore } from '@/lib/firebase-admin';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
    gender: z.string().optional(),
    biometricData: z.any().optional(),
    figure: z.string().optional(),
    colorimetry: z.string().optional(),
    preferences: z.string().optional(),
    accentuate: z.string().optional(),
    minimize: z.string().optional(),
    knowledgeBase: z.string().optional(),
  }).optional(),
  openaiApiKey: z.string().optional(),
});

async function checkDomain(openai: OpenAI, message: string): Promise<boolean> {
  const guardrailPrompt = `Actúa como un clasificador de seguridad inteligente. Determina si la pregunta del usuario está relacionada con: 
  MODA, VESTUARIO, OUTFITS, GUARDARROPA, COLORIMETRÍA, ACCESORIOS, TEXTILES O ESTILO PERSONAL.

  REGLA CRÍTICA: También debes permitir mensajes que describan EVENTOS, REUNIONES O CONTEXTO SOCIAL donde el usuario necesite asesoría de imagen (ej: "voy a una cena con inversores", "quiero impresionar en mi nuevo trabajo").

  Responde ÚNICAMENTE con la palabra "PERMITIDO" o "BLOQUEADO".

  MENSAJE DEL USUARIO: "${message}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: guardrailPrompt }],
    temperature: 0,
    max_tokens: 5,
  });

  const decision = response.choices[0].message.content?.trim().toUpperCase();
  return decision === "PERMITIDO";
}

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("No se detectó una API Key de OpenAI válida.");

  const openai = new OpenAI({ apiKey });

  let config = {
    fallbackMessage: "Lo siento, como tu asesor de Pilar Catalán, solo puedo responder preguntas relacionadas con moda y estilo personal. Por favor, cuéntame más sobre el look o el evento que tienes en mente.",
    strictMode: true
  };

  try {
    const configDoc = await adminFirestore.doc('app_config/assistant_scope').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      config = { ...config, ...data };
    }
  } catch (e) {
    console.warn("Firestore Admin Error (Token/Auth): Usando configuración local por defecto.", e);
  }

  const isAllowed = await checkDomain(openai, input.message);
  if (!isAllowed) return config.fallbackMessage;

  const bio = input.userContext?.biometricData || {};
  const gender = input.userContext?.gender || bio.genero || 'Femenino';
  const temp = bio.temperatura || 'Cálida';
  const figure = bio.cuerpo?.figure_geometrica || 'Reloj de Arena';

  const systemPrompt = `Eres el asesor personal de imagen de Pilar Catalán. 
  
  GÉNERO DEL USUARIO: ${gender}. 
  REGLA DE ORO DE DOMINIO: SOLO puedes responder sobre asesoramiento de imagen y moda para el género ${gender}.
  Si el género es "Masculino", NO sugieras bajo ninguna circunstancia prendas femeninas como vestidos, faldas o blusas.
  Si el usuario describe un evento o reunión, usa esa información para dar el consejo de vestuario más profesional y adecuado.

  PERSONALIDAD:
  1. Humano y directo. Habla de tú.
  2. SÍNTESIS EXTREMA: Máximo 2 o 3 frases potentes.
  3. CONTEXTO REAL: Temperatura ${temp} y figura ${figure}.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || config.fallbackMessage;
}
