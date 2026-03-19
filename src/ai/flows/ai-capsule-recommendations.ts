'use server';
/**
 * @fileOverview Generación de cápsulas de moda personalizadas utilizando OpenAI GPT-4o.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const WardrobeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: z.any(),
  colorimetryAnalysis: z.string(),
  figureAnalysis: z.string(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
  openaiApiKey: z.string().optional(),
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
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const prompt = `Eres un experto estilista de Pilar Cifuentes Catalán. Crea 2 cápsulas de ropa (4 prendas cada una).
    
  PERFIL FÍSICO: Figura ${input.figureAnalysis}, Colorimetría ${input.colorimetryAnalysis}.
  PREFERENCIAS: ${JSON.stringify(input.stylePreferences)}.
  EVENTO: ${input.eventType}, CLIMA: ${input.weatherConditions}.
  
  ARMARIO ACTUAL: ${JSON.stringify(input.wardrobeItems)}
  
  INSTRUCCIONES:
  - Prioriza los ítems reales del armario.
  - Para ítems faltantes, sugiere compras (source: 'shop').
  - Devuelve un JSON que cumpla con el esquema solicitado.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || "{}");
  return {
    capsules: content.capsules || []
  };
}
