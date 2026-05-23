
'use server';
/**
 * @fileOverview Chat interactivo con Restricción de Dominio (Guardrail).
 * Solo responde sobre moda, vestuario y estilo personal.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminFirestore } from '@/lib/firebase-admin';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
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

/**
 * Capa 2: Backend Guardrail
 * Clasifica si el mensaje está en el dominio permitido.
 */
async function checkDomain(openai: OpenAI, message: string): Promise<boolean> {
  const guardrailPrompt = `Actúa como un clasificador de seguridad. Determina si la pregunta del usuario está relacionada con: 
  MODA, VESTUARIO, OUTFITS, GUARDARROPA, COLORIMETRÍA, ACCESORIOS, TEXTILES O ESTILO PERSONAL.

  Responde ÚNICAMENTE con la palabra "PERMITIDO" o "BLOQUEADO".

  EJEMPLOS DE BLOQUEO:
  - "¿Quién ganó el mundial anterior?"
  - "¿Cuál es el presidente de X país?"
  - "¿Qué marca vende más tenis en el mundo?"
  - "Explícame bitcoin"
  - "Resuelve esta ecuación"

  EJEMPLOS PERMITIDOS:
  - "¿Qué outfit me recomiendas para una cena formal?"
  - "¿Qué colores me favorecen?"
  - "¿Qué zapatos combinan con este look?"

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

  // 1. Cargar Configuración de Firestore (Capa 1)
  // Corregido: La ruta debe tener componentes pares (app_config/assistant_scope)
  const configDoc = await adminFirestore.doc('app_config/assistant_scope').get();
  const config = configDoc.exists ? configDoc.data() : {
    fallbackMessage: "Lo siento, como tu asesor de Pilar Catalán, solo puedo responder preguntas relacionadas con moda, vestuario, colorimetría y estilo personal. ¿En qué look trabajamos hoy?",
    strictMode: true
  };

  // 2. Ejecutar Guardrail (Capa 2)
  const isAllowed = await checkDomain(openai, input.message);
  if (!isAllowed) {
    return config.fallbackMessage;
  }

  // 3. Prompt Estricto (Capa 3)
  const bio = input.userContext?.biometricData || {};
  const temp = bio.temperatura || 'Cálida';
  const figure = bio.cuerpo?.figure_geometrica || 'Reloj de Arena';

  const systemPrompt = `Eres el asesor personal de imagen de Pilar Catalán. 
  
  REGLA DE ORO DE DOMINIO:
  SOLO puedes responder sobre asesoramiento de imagen, moda, colorimetría y vestuario. 
  NO debes responder preguntas de cultura general, deportes, política, noticias, finanzas o temas ajenos. 
  Si el usuario intenta cambiar de tema, declina amablemente y vuelve al contexto de la moda.

  PERSONALIDAD:
  1. Humano y directo. Habla de tú.
  2. SÍNTESIS EXTREMA: Máximo 2 o 3 frases potentes.
  3. CONTEXTO REAL: Temperatura ${temp} y figura ${figure}.
  
  CONTEXTO DE ESTILO:
  - Estilos: ${input.userContext?.preferences || 'No definidos'}
  - Base: ${input.userContext?.knowledgeBase || 'Tendencias modernas'}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || config.fallbackMessage;
}
