'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta en el armario real.
 * Refuerzo: Máximo 2 cápsulas y límite de 1 prenda repetida entre ellas.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { searchPinterestPins } from '@/services/pinterest';

const WardrobeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: z.any(),
  colorimetryAnalysis: z.string(),
  figureAnalysis: z.string(),
  knowledgeBase: z.string().optional(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
  openaiApiKey: z.string().optional(),
  pinterestToken: z.string().optional(),
});

const CapsuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  date: z.string(),
  items: z.array(z.object({
    name: z.string(),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'pinterest']),
    wardrobeItemId: z.string().optional(),
    imageUrl: z.string().optional(),
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

  // 1. Obtención de Inspiración de Pinterest (Contexto Visual)
  const searchQuery = `${input.eventType} ${input.weatherConditions} fashion style ${input.colorimetryAnalysis}`;
  const pins = await searchPinterestPins(searchQuery, input.pinterestToken);

  // 2. Razonamiento Maestro con GPT-4o
  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán.
TU MISIÓN: Crear exactamente 2 cápsulas de moda HÍBRIDAS donde la prioridad ABSOLUTA es la ropa que el usuario YA TIENE en su armario.

DATOS DEL USUARIO:
- Figura: ${input.figureAnalysis}
- Colorimetría: ${input.colorimetryAnalysis}
- Conocimiento Maestro: ${input.knowledgeBase || 'Sin guías adicionales'}

ARMARIO REAL DEL USUARIO (USA ESTOS IDs):
${JSON.stringify(input.wardrobeItems)}

INSPIRACIÓN PINTEREST (SOLO SI FALTA ALGO):
${JSON.stringify(pins)}

REGLAS DE ORO:
1. Genera exactamente 2 cápsulas (ni más, ni menos).
2. Cada cápsula debe tener 4 prendas.
3. PRIORIDAD ARMARIO: Al menos 3 prendas de cada cápsula DEBEN ser del armario real.
4. REGLA DE REPETICIÓN: Entre las 2 cápsulas generadas, SOLO PUEDES REPETIR 1 PRENDA DEL ARMARIO como máximo. Las otras deben ser diferentes.
5. Para prendas del armario: 'source' debe ser 'wardrobe' y 'wardrobeItemId' debe coincidir EXACTAMENTE con un ID del JSON.
6. Para prendas externas: 'source' debe ser 'pinterest' y usar 'imageUrl' de los pins proporcionados.
7. Asigna un ID único aleatorio a cada cápsula.

Responde ÚNICAMENTE con un JSON válido con la propiedad "capsules" que sea un array de 2 objetos.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Eres un sistema de respuesta JSON experto en moda. Generas exactamente 2 cápsulas y evitas repetir más de una prenda entre ellas." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const responseText = finalResponse.choices[0].message.content || '{"capsules": []}';
  try {
    const content = JSON.parse(responseText);
    const date = new Date().toISOString();
    return {
      capsules: (content.capsules || []).map((c: any) => ({ ...c, date }))
    };
  } catch (e) {
    console.error("Error parsing AI response", e);
    return { capsules: [] };
  }
}
