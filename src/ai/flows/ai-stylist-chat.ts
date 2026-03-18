
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
    Tu objetivo es proporcionar asesoría de imagen profesional basada en ciencia del estilo.
    
    CONTEXTO DEL USUARIO ACTUAL:
    - Figura identificada: ${input.userContext?.figure || 'Aún no analizada'}
    - Colorimetría identificada: ${input.userContext?.colorimetry || 'Aún no analizada'}
    - Estilos preferidos: ${input.userContext?.preferences || 'Generales'}
    
    REGLAS DE ORO:
    1. Sé amable, sofisticado, directo e inspirador.
    2. Si los datos físicos no están analizados, recomienda encarecidamente realizar el análisis en la sección de Avatar para una precisión total.
    3. Basa tus consejos técnicos siempre en la paleta de colores y el tipo de cuerpo detectado por Gemini.
    
    PREGUNTA DEL USUARIO: ${input.message}`,
  });
  return text;
}
