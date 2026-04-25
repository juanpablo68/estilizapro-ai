'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * Ahora genera 6 ítems por outfit, garantizando 2 accesorios y respeto total al género.
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
  name: z.string().describe('Un nombre creativo para el outfit completo en español'),
  description: z.string().describe('Breve descripción del por qué este look funciona'),
  items: z.array(z.object({
    name: z.string().describe('Nombre descriptivo de la prenda en ESPAÑOL'),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional().describe('El ID EXACTO del objeto del armario'),
    searchKeywords: z.string().describe('English keywords for Unsplash API. Use product-only descriptions like "mens luxury watch" or "womens leather bag"'),
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

  const prompt = `Actúa como el Stylist Maestro de Pilar Cifuentes Catalán. Crea 2 outfits (cápsulas) para: "${input.eventType}" y clima: "${input.weatherConditions}".

REGLAS CRÍTICAS DE COMPOSICIÓN:
1. CANTIDAD: Cada outfit DEBE tener exactamente entre 5 y 6 ítems para un look completo.
2. ACCESORIOS: Es OBLIGATORIO que cada outfit incluya al menos 2 accesorios (accessory).
3. GÉNERO: El usuario es de género ${genderContext}. TODO lo sugerido (prendas y accesorios) DEBE ser estrictamente para ${genderContext}. No mezcles estilos de géneros opuestos.
4. PRIORIDAD ARMARIO: Usa los ítems de "ARMARIO REAL" abajo. Si la prenda existe, DEBES marcarla como source: "wardrobe" y poner su "id" exacto.
5. NOMBRADO: Cada ítem DEBE tener un "name" descriptivo en ESPAÑOL.
6. BÚSQUEDA EXTERNA: Para prendas externas, genera "searchKeywords" en INGLÉS incluyendo el género (ej. "men's watch" o "women's handbag") enfocados en "flat lay product photography" sin personas.

ARMARIO REAL DISPONIBLE:
${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Sugiere outfits externos."}

PERFIL USUARIO:
- Género: ${genderContext}
- Figura: ${input.figureAnalysis}
- Color: ${input.colorimetryAnalysis}
- Guía de estilo: ${input.knowledgeBase || 'Seguir tendencias modernas'}`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Experto en estilismo profesional. Solo respondes en JSON estructurado." },
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
        
        const finalName = item.name || (item.source === 'wardrobe' ? 'Prenda de Armario' : `Accesorio Sugerido`);

        if (item.source === 'external') {
          const uKey = getUnsplashKey(input.unsplashAccessKey);
          const images = await searchUnsplashImages(item.searchKeywords, uKey, item.type);
          imageUrl = images.length > 0 ? images[0].url : undefined;
        }

        return {
          ...item,
          name: finalName,
          imageUrl,
          dateAdded: date,
        };
      }));
      
      const enrichedName = `${capsule.name || 'Outfit Maestro'} (${input.eventType} / ${input.weatherConditions})`;

      return {
        ...capsule,
        name: enrichedName,
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