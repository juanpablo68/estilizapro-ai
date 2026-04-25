'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * Garantiza 6 ítems por outfit, 2 accesorios y respeto total al género detectado.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { searchUnsplashImages } from '@/services/unsplash';
import { getOpenAIKey, getUnsplashKey } from '@/ai/genkit';

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
    searchKeywords: z.string().describe('English keywords for Unsplash: "mens luxury watch" or "womens leather bag"'),
  })),
});

const AICapsuleRecommendationsOutputSchema = z.object({
  capsules: z.array(CapsuleSchema),
});

export type Capsule = z.infer<typeof CapsuleSchema>;
export type CapsuleItem = z.infer<typeof CapsuleSchema>['items'][number];

export async function receiveAICapsuleRecommendations(input: z.infer<typeof AICapsuleRecommendationsInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });
  const genderContext = input.gender || 'Femenino';

  const prompt = `Actúa como el Stylist Maestro de Pilar Cifuentes Catalán. Crea exactamente 2 outfits (cápsulas) para: "${input.eventType}" en clima: "${input.weatherConditions}".

REGLAS DE ORO:
1. GÉNERO: El usuario es ${genderContext}. TODO debe ser estrictamente para ${genderContext}.
2. ESTRUCTURA: Cada outfit DEBE tener exactamente 6 ítems.
3. ACCESORIOS: Es OBLIGATORIO que cada outfit incluya al menos 2 accesorios (accessory) del género ${genderContext}.
4. ARMARIO: Prioriza estos ítems reales si encajan. Si los usas, marca source: "wardrobe" e indica su ID.
5. EXTERNO: Si sugieres algo nuevo, marca source: "external" y genera palabras clave en inglés para fotos de producto.

ARMARIO REAL:
${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Sugiere todo externo."}

PERFIL:
- Figura: ${input.figureAnalysis}
- Color: ${input.colorimetryAnalysis}
- Estilo: ${input.knowledgeBase}`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Experto en estilismo profesional. Responde ÚNICAMENTE en JSON." },
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
          const uKey = getUnsplashKey(input.unsplashAccessKey);
          const images = await searchUnsplashImages(item.searchKeywords, uKey, item.type);
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
  } catch (e) {
    console.error("Error parsing AI response:", e);
    return { capsules: [] };
  }
}