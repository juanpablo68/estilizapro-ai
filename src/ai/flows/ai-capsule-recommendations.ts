'use server';
/**
 * @fileOverview Generación de cápsulas de moda personalizadas utilizando Razonamiento Avanzado GPT-4o.
 * 
 * Este flujo analiza el perfil del usuario, el clima y el evento para crear outfits
 * priorizando las prendas reales del armario local.
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
    wardrobeItemId: z.string().optional().describe('El ID exacto de la prenda si proviene del armario.'),
    shopLink: z.string().optional(),
    styleHint: z.string().describe('Razón técnica de por qué esta prenda encaja con la colorimetría o figura.'),
  })),
});

const AICapsuleRecommendationsOutputSchema = z.object({
  capsules: z.array(CapsuleSchema),
});

export type Capsule = z.infer<typeof CapsuleSchema>;
export type CapsuleItem = z.infer<typeof CapsuleSchema>['items'][number];

export async function receiveAICapsuleRecommendations(input: z.infer<typeof AICapsuleRecommendationsInputSchema>) {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida para el razonamiento de cápsulas.");

  const openai = new OpenAI({ apiKey });

  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán. Tu misión es crear 2 cápsulas de estilo impecables.

DATOS DEL USUARIO:
- Figura: ${input.figureAnalysis}
- Colorimetría: ${input.colorimetryAnalysis}
- Preferencias: ${JSON.stringify(input.stylePreferences)}

CONTEXTO:
- Evento/Plan: ${input.eventType}
- Clima: ${input.weatherConditions}

ARMARIO REAL DISPONIBLE:
${JSON.stringify(input.wardrobeItems)}

INSTRUCCIONES DE RAZONAMIENTO:
1. Analiza qué prendas del "ARMARIO REAL" encajan mejor con el evento y el perfil físico.
2. Crea 2 outfits (cápsulas) de 4 prendas cada uno.
3. REGLA DE ORO: Si usas una prenda del armario, el campo 'source' debe ser 'wardrobe' y DEBES incluir su 'wardrobeItemId' exacto.
4. Solo si falta algo esencial para completar el look, sugiere una compra ('source': 'shop').
5. Explica en 'styleHint' por qué esa prenda favorece al usuario según su colorimetría o figura.

Devuelve un JSON con la estructura: { "capsules": [...] }`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Eres un experto en moda que solo responde en formato JSON válido." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || "{}");
  return {
    capsules: content.capsules || []
  };
}
