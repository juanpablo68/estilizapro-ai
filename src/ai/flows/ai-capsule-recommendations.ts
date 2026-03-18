
'use server';
/**
 * @fileOverview Generación de cápsulas de moda personalizadas utilizando Gemini.
 */

import { ai, GEMINI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const WardrobeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  imageDataUri: z.string(),
});

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: z.any(),
  colorimetryAnalysis: z.string(),
  figureAnalysis: z.string(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
});

const CapsuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  occasion: z.string(),
  items: z.array(z.object({
    name: z.string(),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'shop']),
    wardrobeItemId: z.string().optional(),
    shopLink: z.string().optional(),
    styleHint: z.string(),
  })),
});

const AICapsuleRecommendationsOutputSchema = z.object({
  capsules: z.array(CapsuleSchema),
});

export type Capsule = z.infer<typeof CapsuleSchema>;
export type CapsuleItem = z.infer<typeof CapsuleSchema>['items'][number];

export async function receiveAICapsuleRecommendations(input: z.infer<typeof AICapsuleRecommendationsInputSchema>) {
  const { output } = await ai.generate({
    model: GEMINI_MODEL,
    prompt: `Eres un experto estilista e imagen consultant de Pilar Cifuentes Catalán. Crea 2 cápsulas de ropa personalizadas de 4 prendas cada una.
    
    PERFIL FÍSICO: Figura ${input.figureAnalysis}, Colorimetría ${input.colorimetryAnalysis}.
    PREFERENCIAS: ${JSON.stringify(input.stylePreferences)}.
    EVENTO: ${input.eventType}, CLIMA: ${input.weatherConditions}.
    
    INSTRUCCIONES:
    - Prioriza los ítems reales del armario del usuario: ${JSON.stringify(input.wardrobeItems.map(i => ({id: i.id, name: i.name, type: i.type})))}
    - Para ítems faltantes necesarios para completar el look, sugiere compras (source: 'shop') con un 'styleHint' preciso para buscar en tiendas.
    - Asegúrate de que las combinaciones respeten estrictamente las reglas de colorimetría y morfología analizadas.`,
    output: { schema: AICapsuleRecommendationsOutputSchema }
  });

  if (!output) throw new Error("El cerebro de Gemini no pudo generar las cápsulas.");
  return output;
}
