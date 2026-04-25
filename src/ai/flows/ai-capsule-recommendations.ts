'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * Garantiza 6 imágenes totales por outfit, con al menos 2 accesorios.
 * REGLA DE ORO: Sin humanos en las imágenes sugeridas.
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
  gender: z.string().optional(),
  knowledgeBase: z.string().optional(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
  openaiApiKey: z.string().optional(),
  unsplashAccessKey: z.string().optional(),
});

const CapsuleSchema = z.object({
  id: z.string(),
  name: z.string().describe('Nombre creativo del look completo'),
  description: z.string().describe('Explicación de por qué este look es ideal'),
  items: z.array(z.object({
    name: z.string().describe('Nombre de la prenda en ESPAÑOL'),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional().describe('ID del armario si aplica'),
    searchKeywords: z.string().describe('English keywords for Unsplash product: e.g. "luxury leather watch" or "cotton t-shirt flat lay"'),
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
  const genderContext = input.gender || 'Femenino';

  const prompt = `Actúa como el Stylist Maestro de Pilar Cifuentes Catalán. Crea exactamente 1 outfit coordinado para: "${input.eventType}" en clima: "${input.weatherConditions}".

REGLAS DE COMPOSICIÓN (OBLIGATORIAS):
1. GÉNERO: El usuario es ${genderContext}. TODO debe ser estrictamente para este género.
2. CANTIDAD: El outfit DEBE tener exactamente 6 ítems/imágenes en total.
3. ACCESORIOS: Es OBLIGATORIO que incluya al menos 2 accesorios (type: "accessory") específicos para ${genderContext}.
4. SIN HUMANOS: Las búsquedas externas DEBEN enfocarse en fotografía de producto puro (flat lay/isolated).

ARMARIO REAL: Prioriza estos ítems si encajan. Marca source: "wardrobe" e indica su ID.
ARMARIO: ${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Usa solo source: 'external'."}

RESPONDE ÚNICAMENTE CON ESTE FORMATO JSON:
{
  "capsules": [
    {
      "name": "Nombre del Look",
      "description": "Explicación",
      "items": [
        { "name": "Prenda 1", "type": "top", "source": "wardrobe/external", "wardrobeItemId": "...", "searchKeywords": "men blue shirt product shot" },
        ... (exactamente 6 items, incluyendo al menos 2 accesorios)
      ]
    }
  ]
}`;

  try {
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Experto en estilismo profesional. Prioriza la pureza visual del producto sin modelos humanos." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = finalResponse.choices[0].message.content || '{"capsules": []}';
    const content = JSON.parse(responseText);
    const date = new Date().toISOString();
    
    if (!content.capsules || !Array.isArray(content.capsules)) {
      throw new Error("Formato de respuesta AI inválido.");
    }

    const processedCapsules = await Promise.all(content.capsules.map(async (capsule: any, cIdx: number) => {
      const processedItems = await Promise.all((capsule.items || []).map(async (item: any) => {
        let imageUrl = undefined;

        if (item.source === 'external') {
          const uKey = input.unsplashAccessKey || process.env.UNSPLASH_ACCESS_KEY;
          // Inyectamos el género en la búsqueda para asegurar consistencia
          const genderTerm = genderContext === 'Masculino' ? 'men' : 'women';
          const query = `${genderTerm} ${item.searchKeywords}`;
          const images = await searchUnsplashImages(query, uKey, item.type);
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
        id: `cap-${Date.now()}-${cIdx}`,
        date,
        items: processedItems
      };
    }));

    return { capsules: processedCapsules };
  } catch (e: any) {
    console.error("Error en Capsulizador AI:", e);
    throw new Error(`Error al generar cápsulas: ${e.message}`);
  }
}
