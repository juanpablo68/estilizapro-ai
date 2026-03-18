
'use server';
/**
 * @fileOverview Chat interactivo con el Asistente Estilista utilizando Gemini.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIChatInputSchema = z.object({
  message: z.string(),
  userContext: z.object({
    figure: z.string().optional(),
    colorimetry: z.string().optional(),
    preferences: z.string().optional(),
  }).optional(),
});

export async function chatWithAIStylist(input: z.infer<typeof AIChatInputSchema>) {
  const { text } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: `Eres el asistente experto de la prestigiosa estilista Pilar Cifuentes Catalán.
    Tu objetivo es proporcionar asesoría de imagen profesional de alto nivel.
    
    CONTEXTO DEL USUARIO:
    - Figura: ${input.userContext?.figure || 'Aún no analizada'}
    - Colorimetría: ${input.userContext?.colorimetry || 'Aún no analizada'}
    - Estilos: ${input.userContext?.preferences || 'Generales'}
    
    REGLAS DE RESPUESTA:
    1. Sé amable, sofisticado e inspirador.
    2. Si los datos físicos no están analizados, sugiere realizar el análisis en la sección de Avatar.
    3. Basa tus consejos en la paleta de colores y el tipo de cuerpo detectado.
    
    PREGUNTA DEL USUARIO: ${input.message}`,
  });
  return text;
}
