'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * - Diferenciación garantizada entre los 2 outfits.
 * - Máximo 2 prendas externas por outfit.
 * - Identificadores de armario estrictamente validados.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { searchUnsplashImages } from '@/services/unsplash';

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
  unsplashAccessKey: z.string().optional(),
});

const CapsuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  items: z.array(z.object({
    name: z.string().describe('Name of the item in Spanish'),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional().describe('The EXACT ID of the object from the wardrobe list provided'),
    searchKeywords: z.string().describe('Descriptive English keywords for product search. MUST include "product shot" and "flat lay"'),
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

  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán. Crea 2 outfits (cápsulas) TOTALMENTE DIFERENTES para: "${input.eventType}" y clima: "${input.weatherConditions}".

REGLAS DE NEGOCIO:
1. PRIORIDAD ARMARIO: Usa los ítems de "ARMARIO REAL" abajo. Si la prenda existe en el armario, DEBES marcarla como source: "wardrobe" y poner su "id" exacto en el campo "wardrobeItemId".
2. LIMITACIÓN EXTERNA: Máximo 2 sugerencias externas por outfit. Úsalas solo si falta algo esencial que no está en el armario.
3. NOMBRES: Cada item debe tener un "name" descriptivo en ESPAÑOL.
4. CONTRASTE: Outfit 1 y Outfit 2 deben ser radicalmente diferentes en color y estilo.
5. BÚSQUEDA: Para externas, genera "searchKeywords" en INGLÉS descriptivos de producto (ej: "minimalist leather handbag flat lay product shot").
6. FORMATO: Responde SOLO con un objeto JSON con el array "capsules".

ARMARIO REAL DISPONIBLE:
${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Sugiere outfits externos."}

PERFIL USUARIO:
- Figura: ${input.figureAnalysis}
- Color: ${input.colorimetryAnalysis}
- Guía: ${input.knowledgeBase || 'Seguir tendencias'}`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Experto en estilismo profesional. Responde SIEMPRE con JSON. Los nombres de las prendas deben estar en español y ser descriptivos." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const responseText = finalResponse.choices[0].message.content || '{"capsules": []}';
  try {
    const content = JSON.parse(responseText);
    const date = new Date().toISOString();
    
    const processedCapsules = await Promise.all((content.capsules || []).map(async (capsule: any, cIdx: number) => {
      const processedItems = await Promise.all((capsule.items || []).map(async (item: any) => {
        let imageUrl = undefined;
        
        const finalName = item.name || (item.source === 'wardrobe' ? 'Prenda de Armario' : `Sugerencia de ${item.type}`);

        if (item.source === 'external') {
          const images = await searchUnsplashImages(item.searchKeywords, input.unsplashAccessKey, item.type);
          imageUrl = images.length > 0 ? images[0].url : undefined;
        }

        return {
          ...item,
          name: finalName,
          imageUrl,
          dateAdded: date,
        };
      }));
      
      return {
        ...capsule,
        id: `cap-${Date.now()}-${cIdx}`,
        date,
        eventType: input.eventType,
        weatherConditions: input.weatherConditions,
        items: processedItems
      };
    }));

    return { capsules: processedCapsules };
  } catch (e) {
    console.error("Error processing AI response", e);
    return { capsules: [] };
  }
}
