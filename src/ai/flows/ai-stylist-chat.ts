'use server';
/**
 * @fileOverview Chat interactivo con el Asistente de Vestuario con Memoria Total.
 * Utiliza el diagnóstico quirúrgico (ojos, piel, cabello, silueta) para personalizar cada respuesta.
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

  // Extracción de la memoria biométrica diagnosticada por paletas
  const bio = input.userContext?.biometricData || {};
  const colorimetria = bio.colorimetria || {};
  const rostro = bio.rostro || {};
  const cuerpo = bio.cuerpo || {};
  
  const systemPrompt = `Eres el "Asistente de Vestuario" oficial de PILAR CIFUENTES. 
  
  TIENES MEMORIA TOTAL DEL USUARIO. AQUÍ ESTÁ SU DIAGNÓSTICO REAL (QUIRÚRGICO):
  
  1. COLORIMETRÍA:
     - Estación Sugerida: ${colorimetria.estacion_sugerida || 'No analizada'}
     - Tono de Piel: ${colorimetria.tono_piel || 'No analizado'} (Subtono: ${colorimetria.subtono || 'No analizado'})
     - Ojos (Matiz exacto): ${rostro.ojos?.color_detalle || 'No analizado'}
     - Cabello (Natural): ${rostro.cabello?.color_natural || 'No analizado'}
     - Contraste Facial: ${colorimetria.contraste_facial || 'No analizado'}
  
  2. MORFOLOGÍA (SILUETA):
     - Figura Geométrica: ${cuerpo.figura_geometrica || 'No analizada'}
     - Complexión: ${cuerpo.complexion || 'No analizada'}
  
  3. PREFERENCIAS Y BASE DE CONOCIMIENTO:
     - Estilos: ${input.userContext?.preferences || 'No definidos'}
     - Objetivos: Resaltar ${input.userContext?.accentuate || 'nada'}, Disimular ${input.userContext?.minimize || 'nada'}.
     - Reglas Maestras: ${input.userContext?.knowledgeBase || 'Seguir tendencias modernas.'}
  
  INSTRUCCIONES CRÍTICAS:
  - Nunca digas "no tengo registro". Los datos arriba son la VERDAD ABSOLUTA del usuario.
  - Si el usuario pregunta qué colores le quedan bien, usa su Estación (${colorimetria.estacion_sugerida}) y sus Ojos (${rostro.ojos?.color_detalle}).
  - Si pregunta por prendas, adapta la sugerencia a su Figura (${cuerpo.figura_geometrica}).
  - Mantén un tono de experto de lujo, asertivo y altamente analítico.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
