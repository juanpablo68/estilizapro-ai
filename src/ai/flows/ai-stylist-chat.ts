'use server';
/**
 * @fileOverview Chat interactivo con el Asistente de Vestuario con Memoria Total.
 * Utiliza el diagnóstico quirúrgico y las preferencias del usuario para cada respuesta.
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

  // Extracción profunda y segura de la memoria biométrica
  const bio = input.userContext?.biometricData || {};
  
  const getBio = (obj: any, keys: string[], fallback: string) => {
    let curr = obj;
    for (const k of keys) {
      if (curr && curr[k]) curr = curr[k];
      else return fallback;
    }
    return typeof curr === 'string' ? curr : fallback;
  };

  // Mapeo exhaustivo de la identidad del usuario
  const genero = bio.genero || 'Usuario';
  const piel = getBio(bio, ['colorimetria', 'tono_piel'], 'Cargando...');
  const subtono = getBio(bio, ['colorimetria', 'subtono'], 'Cargando...');
  const ojos = getBio(bio, ['rostro', 'ojos', 'color_detalle'], 'Cargando...');
  const cabello = getBio(bio, ['rostro', 'cabello', 'color_natural'], 'Cargando...');
  const estacion = getBio(bio, ['colorimetria', 'estacion_sugerida'], 'Cargando...');
  const figura = getBio(bio, ['cuerpo', 'figura_geometrica'], input.userContext?.figure || 'Cargando...');

  const systemPrompt = `Eres el "Asistente de Vestuario" de PILAR CIFUENTES. 
  
  TIENES ACCESO A LA MEMORIA BIOMÉTRICA DEL USUARIO. SIEMPRE USA ESTOS DATOS EN TUS CONSEJOS:
  
  IDENTIDAD REAL DEL USUARIO:
  - Género: ${genero}
  - Tono de Piel: ${piel} (Subtono: ${subtono})
  - Color de Ojos: ${ojos} (Diagnóstico quirúrgico real)
  - Color de Cabello: ${cabello} (Tono natural identificado)
  - Estación de Color: ${estacion}
  - Figura Corporal: ${figura}
  
  CONTEXTO DE ESTILO:
  - Estilos favoritos: ${input.userContext?.preferences || 'No definidos'}
  - Áreas a resaltar: ${input.userContext?.accentuate || 'No definidas'}
  - Áreas a disimular: ${input.userContext?.minimize || 'No definidas'}
  - Base de Conocimiento Especializada: ${input.userContext?.knowledgeBase || 'Seguir tendencias modernas'}

  REGLAS DE INTERACCIÓN:
  1. No digas "no tengo registro" o "no puedo ver tus fotos". Tienes los datos arriba.
  2. Si el usuario te pregunta "¿de qué color son mis ojos?", responde con el dato específico: "${ojos}".
  3. Adapta tus sugerencias de ropa basándote estrictamente en su Estación (${estacion}) y Figura (${figura}).
  4. Tu tono debe ser lujoso, profesional y asertivo.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.message }
    ]
  });

  return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
}
