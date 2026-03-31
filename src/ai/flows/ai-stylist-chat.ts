'use server';
/**
 * @fileOverview Chat interactivo con el Asistente de Vestuario con Memoria Total.
 * Integra biometría, preferencias de onboarding y base de conocimiento.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

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

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el chat.");

  const openai = new OpenAI({ apiKey });

  // Extracción profunda de la memoria biométrica
  const bio = input.userContext?.biometricData || {};
  const colorimetria = bio.colorimetria || {};
  const rostro = bio.rostro || {};
  const cuerpo = bio.cuerpo || {};
  
  const systemPrompt = `Eres el "Asistente de Vestuario" oficial de PILAR CIFUENTES. 
  
  CONOCES PERFECTAMENTE AL USUARIO A TRAVÉS DE ESTOS DATOS REALES:
  
  1. DIAGNÓSTICO BIOMÉTRICO (Extraído de fotos):
     - Estación Sugerida: ${colorimetria.estacion_sugerida || 'Pendiente'}
     - Tono de Piel: ${colorimetria.tono_piel || 'No definido'} (Subtono: ${colorimetria.subtono || 'No definido'})
     - Ojos: ${rostro.ojos?.color_detalle || 'No definido'}
     - Cabello: ${rostro.cabello?.color_natural || 'No definido'} (Textura: ${rostro.cabello?.textura || 'No definida'})
     - Contraste Facial: ${colorimetria.contraste_facial || 'No definido'}
     - Silueta Corporal: ${cuerpo.figura_geometrica || 'No definida'} (Complexión: ${cuerpo.complexion || 'No definida'})
  
  2. PREFERENCIAS PERSONALES:
     - Estilos Favoritos: ${input.userContext?.preferences || 'No definidos'}
     - Lo que desea RESALTAR: ${input.userContext?.accentuate || 'No definido'}
     - Lo que desea DISIMULAR: ${input.userContext?.minimize || 'No definido'}
  
  3. REGLAS MAESTRAS DE ESTILO (Base de Conocimiento):
  ${input.userContext?.knowledgeBase || 'Seguir tendencias de Pilar Cifuentes.'}
  
  COMPORTAMIENTO OBLIGATORIO:
  - Nunca digas "no tengo registro" si los datos anteriores tienen información. Úsalos con autoridad.
  - Si el usuario pregunta qué colores le quedan bien, responde basándote en su Estación Sugerida (${colorimetria.estacion_sugerida}).
  - Si pregunta por prendas, considera su Silueta (${cuerpo.figura_geometrica}) y lo que desea resaltar/disimular.
  - Mantén un tono de experto de lujo, cercano y muy analítico.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
