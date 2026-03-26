'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * - Prioriza IDs de armario real proporcionados.
 * - Máximo 2 prendas externas por outfit.
 * - Outfits garantizadamente diferentes entre sí.
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
    searchKeywords: z.string().describe('Keywords en inglés para buscar solo el PRODUCTO de ropa, sin modelos'),
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

  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán. Debes crear exactamente 2 outfits (cápsulas) para la ocasión: "${input.eventType}" y clima: "${input.weatherConditions}".

REGLAS INVIOLABLES:
1. PRIORIDAD TOTAL AL ARMARIO: Usa obligatoriamente los IDs de la lista "ARMARIO REAL". Si usas una prenda de la lista, pon source: "wardrobe" y el "id" exacto que te proporcioné.
2. PRENDAS EXTERNAS: Solo puedes usar source: "external" si falta algo esencial que no esté en el armario. MÁXIMO 2 prendas externas por outfit.
3. DIFERENCIACIÓN: Los 2 outfits deben ser para estilos totalmente diferentes y creativos entre sí.
4. FORMATO: Responde ÚNICAMENTE con un JSON puro que siga esta estructura:
{
  "capsules": [
    {
      "name": "Nombre creativo",
      "description": "Explicación del estilo",
      "items": [
        { "name": "...", "type": "top", "source": "wardrobe", "wardrobeItemId": "ID_DE_LA_LISTA", "searchKeywords": "black blazer flat lay" }
      ]
    }
  ]
}

ARMARIO REAL DISPONIBLE:
${JSON.stringify(input.wardrobeItems)}

No inventes IDs. Si no hay prendas suficientes, usa sugerencias externas hasta el límite de 2.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Experto en moda personalizada. Prioriza armario real. Devuelve JSON válido sin texto adicional." },
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
        
        // Solo buscamos en Unsplash si es externo
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
