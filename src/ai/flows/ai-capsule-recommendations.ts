
'use server';
/**
 * @fileOverview Generación de cápsulas de moda utilizando GPT-4o + Pinterest + Shopify.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { searchPinterestPins, PinterestPin } from '@/services/pinterest';
import { searchShopifyProducts, ShopifyProduct } from '@/services/shopify';

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
  pinterestToken: z.string().optional(),
  shopifyDomain: z.string().optional(),
  shopifyToken: z.string().optional(),
});

const CapsuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  occasion: z.string(),
  items: z.array(z.object({
    name: z.string(),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'pinterest', 'shopify']),
    wardrobeItemId: z.string().optional(),
    externalUrl: z.string().optional(),
    imageUrl: z.string().optional(),
    styleHint: z.string(),
    price: z.string().optional(),
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

  // 1. Análisis y Generación de Query
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "Eres un experto en moda. Analiza el perfil y genera una query de búsqueda de 5 palabras para encontrar ropa ideal." 
      },
      { 
        role: "user", 
        content: `Perfil: ${input.figureAnalysis}, ${input.colorimetryAnalysis}. Evento: ${input.eventType}. Clima: ${input.weatherConditions}.` 
      }
    ],
    response_format: { type: "json_object" }
  });

  const queryContent = JSON.parse(analysisResponse.choices[0].message.content || '{"query": "moda casual"}');
  const searchQuery = queryContent.query || `${input.eventType} ${input.weatherConditions} style`;

  // 2. Data Sourcing Paralelo
  const [pins, products] = await Promise.all([
    searchPinterestPins(searchQuery, input.pinterestToken),
    searchShopifyProducts(searchQuery, input.shopifyDomain, input.shopifyToken)
  ]);

  // 3. Construcción Final de la Cápsula por GPT-4o
  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán.
DATOS: Figura ${input.figureAnalysis}, Colorimetría ${input.colorimetryAnalysis}.
ARMARIO REAL: ${JSON.stringify(input.wardrobeItems)}
INSPIRACIÓN PINTEREST: ${JSON.stringify(pins)}
PRODUCTOS SHOPIFY: ${JSON.stringify(products)}

INSTRUCCIONES:
1. Crea 2 cápsulas de 4 prendas cada una.
2. Prioriza el ARMARIO REAL.
3. Usa PINTEREST para 'moodboards' o inspiración visual si falta algo.
4. Usa SHOPIFY para sugerencias de compra reales.
5. Devuelve un JSON estructurado según el esquema de cápsulas.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Responde solo en JSON válido." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(finalResponse.choices[0].message.content || "{}");
  return {
    capsules: content.capsules || []
  };
}
