'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * - Diferenciación garantizada entre los 2 outfits.
 * - Máximo 2 prendas externas por outfit.
 * - Generación de nombres obligatoria y descriptiva.
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
  name: z.string().describe('Un nombre creativo para el outfit completo en español'),
  description: z.string().describe('Breve descripción del por qué este look funciona'),
  items: z.array(z.object({
    name: z.string().describe('Nombre descriptivo de la prenda en ESPAÑOL'),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional().describe('El ID EXACTO del objeto del armario'),
    searchKeywords: z.string().describe('English keywords for Unsplash API. Use product-only descriptions like "flat lay fashion product photography"'),
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

  const prompt = `Actúa como el Stylist Maestro de Pilar Cifuentes Catalán. Crea 2 outfits (cápsulas) para: "${input.eventType}" y clima: "${input.weatherConditions}".

REGLAS DE ORO:
1. PRIORIDAD ARMARIO: Usa los ítems de "ARMARIO REAL" abajo. Si la prenda existe, DEBES marcarla como source: "wardrobe" y poner su "id" exacto.
2. NOMBRADO: Cada ítem DEBE tener un "name" descriptivo en ESPAÑOL. NO lo dejes vacío.
3. CONTRASTE: Outfit 1 y Outfit 2 deben ser radicalmente diferentes en color y vibra (Ej: uno Formal/Oscuro y otro Casual/Brillante).
4. BÚSQUEDA EXTERNA: Para prendas externas (source: external), genera "searchKeywords" en INGLÉS enfocados en "flat lay product photography" sin personas.
5. FORMATO: Responde SOLO con un objeto JSON con el array "capsules".

ARMARIO REAL DISPONIBLE:
${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Sugiere outfits externos."}

PERFIL USUARIO:
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
