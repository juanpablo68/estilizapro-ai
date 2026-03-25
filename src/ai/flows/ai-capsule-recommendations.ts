'use server';
/**
 * @fileOverview Generación de cápsulas de moda con búsqueda inteligente de prendas externas en Unsplash.
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
  date: z.string(),
  eventType: z.string(),
  weatherConditions: z.string(),
  items: z.array(z.object({
    name: z.string(),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'external']),
    wardrobeItemId: z.string().optional(),
    imageUrl: z.string().optional(),
    searchKeywords: z.string().describe('Palabras clave para buscar esta prenda en una base de datos de imágenes (ej: "navy blue tailored blazer flat lay")'),
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

  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán.
TU MISIÓN: Crear exactamente 2 cápsulas de moda HÍBRIDAS (4 prendas cada una).

REGLAS DE SELECCIÓN:
1. PRIORIDAD ARMARIO: Al menos 3 prendas de cada cápsula DEBEN ser del armario real del usuario.
2. REGLA DE REPETICIÓN: Entre las 2 cápsulas generadas, SOLO PUEDES REPETIR 1 PRENDA DEL ARMARIO como máximo.
3. PRENDAS EXTERNAS (PRODUCT ONLY): Si sugieres una prenda que el usuario NO TIENE (source: 'external'), genera 'searchKeywords' precisos en inglés para buscar una imagen de PRODUCTO ÚNICAMENTE, sin modelos ni maniquíes (ej: "minimalist camel wool coat flat lay isolated").

DATOS DEL USUARIO:
- Figura: ${input.figureAnalysis}
- Colorimetría: ${input.colorimetryAnalysis}
- Evento: ${input.eventType}, Clima: ${input.weatherConditions}

ARMARIO REAL DEL USUARIO:
${JSON.stringify(input.wardrobeItems)}

Responde ÚNICAMENTE con un JSON válido con la propiedad "capsules" que sea un array de 2 objetos según el esquema definido.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Eres un experto en moda que genera respuestas JSON. Priorizas el armario del usuario y generas keywords de búsqueda para prendas externas centradas en el producto sin personas." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const responseText = finalResponse.choices[0].message.content || '{"capsules": []}';
  try {
    const content = JSON.parse(responseText);
    const date = new Date().toISOString();
    
    // FASE DE BÚSQUEDA VISUAL PARA PRENDAS EXTERNAS
    const processedCapsules = await Promise.all((content.capsules || []).map(async (capsule: any) => {
      const processedItems = await Promise.all((capsule.items || []).map(async (item: any) => {
        if (item.source === 'external' && item.searchKeywords) {
          // Buscamos en Unsplash usando las palabras clave de la IA
          const images = await searchUnsplashImages(item.searchKeywords, input.unsplashAccessKey);
          return {
            ...item,
            imageUrl: images.length > 0 ? images[0].url : item.imageUrl
          };
        }
        return item;
      }));
      
      return {
        ...capsule,
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
