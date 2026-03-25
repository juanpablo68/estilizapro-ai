'use server';
/**
 * @fileOverview Generación de cápsulas de moda con búsqueda inteligente de prendas externas en Unsplash.
 * Prioriza el armario del usuario y permite hasta 2 prendas externas por cápsula si es necesario.
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
    wardrobeItemId: z.string().optional().describe('El ID exacto de la prenda en el armario del usuario'),
    imageUrl: z.string().optional(),
    searchKeywords: z.string().describe('Keywords en inglés para buscar solo el PRODUCTO de ropa (ej: "minimalist white cotton t-shirt flat lay")'),
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
TU MISIÓN: Crear exactamente 2 cápsulas de moda HÍBRIDAS (4 prendas cada una) que sean TOTALMENTE DIFERENTES entre sí.

REGLAS CRÍTICAS DE ESTILO:
1. DIFERENCIACIÓN TOTAL: Las 2 cápsulas deben proponer estilos, colores o combinaciones distintas. Si una es casual, la otra debe ser más formal o de un color contrastante.
2. PRIORIDAD ARMARIO: Usa el armario del usuario como base principal.
3. PRENDAS DEL ARMARIO: Para ítems de 'wardrobe', DEBES devolver el 'wardrobeItemId' EXACTO que se te proporciona en la lista. NO inventes IDs.
4. PRENDAS EXTERNAS (MÁXIMO 2 POR CÁPSULA): Si el armario no tiene la prenda ideal para completar el look, sugiere HASTA 2 prendas externas (source: 'external').
5. PRODUCTO SOLAMENTE: Para prendas externas, genera 'searchKeywords' en inglés enfocados ÚNICAMENTE en fotografía de producto sin personas ni modelos (ej: "navy blue blazer flat lay", "white sneakers product shot").

DATOS DEL USUARIO:
- Figura: ${input.figureAnalysis}
- Colorimetría: ${input.colorimetryAnalysis}
- Evento: ${input.eventType}, Clima: ${input.weatherConditions}

ARMARIO REAL DEL USUARIO (ID y Nombre):
${JSON.stringify(input.wardrobeItems)}

Responde ÚNICAMENTE con un JSON válido con la propiedad "capsules" que sea un array de 2 objetos según el esquema definido.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Eres un experto en moda que genera respuestas JSON. Creas outfits variados, priorizas el armario usando IDs exactos y limitas prendas externas a 2 por conjunto." },
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
        if (item.source === 'external' && item.searchKeywords) {
          const images = await searchUnsplashImages(item.searchKeywords, input.unsplashAccessKey);
          return {
            ...item,
            imageUrl: images.length > 0 ? images[0].url : item.imageUrl
          };
        }
        return item;
      }));
      
      const uniqueId = `cap-${Date.now()}-${cIdx}-${Math.random().toString(36).substring(2, 7)}`;
      
      return {
        ...capsule,
        id: uniqueId,
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
