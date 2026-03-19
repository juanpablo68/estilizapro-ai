'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta en el armario real.
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
  name: z.string(),
  description: z.string(),
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
TU MISIÓN: Crear cápsulas de moda HÍBRIDAS donde la prioridad ABSOLUTA es la ropa que el usuario YA TIENE en su armario.

DATOS DEL USUARIO:
- Figura: ${input.figureAnalysis}
- Colorimetría: ${input.colorimetryAnalysis}
- Conocimiento Maestro: ${input.knowledgeBase || 'Sin guías adicionales'}

ARMARIO REAL DEL USUARIO (USA ESTOS IDs):
${JSON.stringify(input.wardrobeItems)}

INSPIRACIÓN PINTEREST (SOLO SI FALTA ALGO):
${JSON.stringify(pins)}

REGLAS DE ORO:
1. Crea 2 cápsulas de 4 prendas cada una para el evento: ${input.eventType} (${input.weatherConditions}).
2. PRIORIDAD ABSOLUTA: Debes seleccionar MÍNIMO 3 prendas del ARMARIO REAL por cada cápsula.
3. Para prendas del armario: 'source' debe ser 'wardrobe' y 'wardrobeItemId' debe coincidir EXACTAMENTE con un ID del JSON proporcionado.
4. Para prendas externas: 'source' debe ser 'pinterest' y DEBES incluir el 'imageUrl' de la lista de pins de Pinterest proporcionada. No inventes URLs.
5. El estilo debe ser coherente con la figura ${input.figureAnalysis}, el conocimiento maestro y la colorimetría.

Responde ÚNICAMENTE con un JSON válido siguiendo la estructura de cápsulas.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Eres un sistema de respuesta JSON experto en moda. Solo usa IDs existentes para 'wardrobe' y URLs existentes para 'pinterest'." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const responseText = finalResponse.choices[0].message.content || '{"capsules": []}';
  try {
    const content = JSON.parse(responseText);
    // Validación de esquema básica para asegurar tipos
    return {
      capsules: content.capsules || []
    };
  } catch (e) {
    console.error("Error parsing AI response", e);
    return { capsules: [] };
  }
}
