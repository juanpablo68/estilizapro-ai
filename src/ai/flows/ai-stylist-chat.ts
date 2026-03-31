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

  // Extracción profunda de la memoria biométrica
  const bio = input.userContext?.biometricData || {};
  const colorimetria = bio.colorimetria || bio || {};
  const rostro = bio.rostro || bio || {};
  const cuerpo = bio.cuerpo || bio || {};
  
  const ojosColor = rostro.ojos?.color_detalle || bio.color_ojos || 'No analizado';
  const peloColor = rostro.cabello?.color_natural || bio.color_cabello || 'No analizado';
  const pielTono = colorimetria.tono_piel || bio.tono_piel || 'No analizado';
  const subtono = colorimetria.subtono || bio.subtono || 'No analizado';
  const estacion = colorimetria.estacion_sugerida || bio.estacion || 'No analizada';
  const figura = cuerpo.figura_geometrica || bio.figura_geometrica || 'No analizada';

  const systemPrompt = `Eres el "Asistente de Vestuario" oficial de PILAR CIFUENTES. 
  
  TIENES MEMORIA TOTAL DEL USUARIO. ESTE ES SU DIAGNÓSTICO QUIRÚRGICO REAL:
  
  1. COLORIMETRÍA:
     - Estación Sugerida: ${estacion}
     - Tono de Piel: ${pielTono} (Subtono: ${subtono})
     - Ojos: ${ojosColor}
     - Cabello: ${peloColor}
     - Contraste: ${colorimetria.contraste_facial || 'No analizado'}
  
  2. MORFOLOGÍA:
     - Figura: ${figura}
  
  3. PREFERENCIAS:
     - Estilos: ${input.userContext?.preferences || 'No definidos'}
     - Resaltar: ${input.userContext?.accentuate || 'nada'}
     - Disimular: ${input.userContext?.minimize || 'nada'}
     - Reglas Maestras: ${input.userContext?.knowledgeBase || 'Seguir tendencias modernas.'}
  
  INSTRUCCIONES CRÍTICAS:
  - NUNCA digas que no tienes registro si los datos arriba están presentes.
  - Tus consejos de color DEBEN basarse en su Estación (${estacion}) y el color de sus Ojos (${ojosColor}).
  - Tus consejos de prendas DEBEN basarse en su Figura (${figura}).
  - Sé asertivo, lujoso y analítico.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}