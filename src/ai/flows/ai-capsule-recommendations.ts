'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * - Diferenciación garantizada entre los 2 outfits.
 * - Máximo 2 prendas externas por outfit.
 * - Palabras clave de búsqueda optimizadas para alta fidelidad visual.
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
    name: z.string(),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional().describe('El ID exacto del objeto en la lista de armario'),
    searchKeywords: z.string().describe('Highly descriptive English keywords for fashion product search (e.g. "minimalist black leather tote bag studio photography")'),
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

  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán. Tu misión es crear exactamente 2 outfits (cápsulas) únicos para la ocasión: "${input.eventType}" y clima: "${input.weatherConditions}".

REGLAS INVIOLABLES DE NEGOCIO:
1. DIFERENCIACIÓN TOTAL: Los 2 outfits DEBEN ser radicalmente diferentes (ej: uno elegante y otro moderno, o uno neutro y otro con color). No repitas el concepto.
2. PRIORIDAD AL ARMARIO: Usa obligatoriamente los IDs de "ARMARIO REAL". Si usas una prenda de la lista, pon source: "wardrobe" y su "id" exacto.
3. LÍMITE EXTERNO: Máximo 2 prendas externas (source: "external") por outfit, solo si es vital para el look.
4. BÚSQUEDA VISUAL: Para prendas externas, genera keywords en inglés muy específicas de MODA Y PRODUCTO (ej: "high-waisted blue denim jeans flat lay").
5. FORMATO: Responde SOLO con JSON puro.

ARMARIO REAL DISPONIBLE:
${JSON.stringify(input.wardrobeItems)}

ANÁLISIS DE USUARIO:
- Figura: ${input.figureAnalysis}
- Colorimetría: ${input.colorimetryAnalysis}
- Reglas: ${input.knowledgeBase || 'Seguir tendencias actuales'}`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Experto en estilismo personalizado. Genera outfits contrastantes y precisos. JSON válido solamente." },
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
