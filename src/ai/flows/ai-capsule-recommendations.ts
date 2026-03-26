'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * - Diferenciación garantizada entre los 2 outfits.
 * - Máximo 2 prendas externas por outfit.
 * - Keywords de búsqueda optimizados para Unsplash (Product Photography).
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
    name: z.string().describe('Name of the item'),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional().describe('The EXACT ID of the object from the wardrobe list'),
    searchKeywords: z.string().describe('Descriptive English keywords for product search. E.g. "minimalist beige trench coat", "tan leather belt studio"'),
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

  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán. Tu misión es crear exactamente 2 outfits (cápsulas) TOTALMENTE DIFERENTES para: "${input.eventType}" y clima: "${input.weatherConditions}".

REGLAS INVIOLABLES DE NEGOCIO:
1. PRIORIDAD ARMARIO: Usa OBLIGATORIAMENTE los ítems de "ARMARIO REAL" listados abajo. Si la prenda existe en el armario, DEBES marcarla como source: "wardrobe" y poner su "id" exacto.
2. LIMITACIÓN EXTERNA: Máximo 2 prendas externas (sugerencias) por outfit. Úsalas solo para completar el look si el armario no tiene lo necesario (ej: si no hay zapatos adecuados).
3. CONTRASTE TOTAL: El Outfit 1 y el Outfit 2 deben ser radicalmente diferentes en color, vibra y estilo (ej: uno empoderado y otro relajado).
4. BÚSQUEDA EN INGLÉS: Para prendas externas, genera "searchKeywords" en inglés súper descriptivos de producto (ej: "structured red blazer studio", "straw wide brim hat").
5. FORMATO: Responde SOLO con un objeto JSON con el array "capsules". 

ARMARIO REAL DISPONIBLE:
${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Sugiere outfits externos."}

PERFIL USUARIO:
- Figura: ${input.figureAnalysis}
- Color: ${input.colorimetryAnalysis}
- Guía de estilo: ${input.knowledgeBase || 'Seguir tendencias actuales'}`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Experto en estilismo y asesoría de imagen profesional. Responde SIEMPRE con JSON estructurado. Prioriza el armario real del usuario." },
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
        
        if (item.source === 'external') {
          const images = await searchUnsplashImages(item.searchKeywords, input.unsplashAccessKey, item.type);
          imageUrl = images.length > 0 ? images[0].url : undefined;
        }

        return {
          ...item,
          imageUrl,
          dateAdded: date,
        };
      }));
      
      return {
        ...capsule,
        id: `cap-${Date.now()}-${cIdx}-${Math.random().toString(36).substr(2, 5)}`,
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
