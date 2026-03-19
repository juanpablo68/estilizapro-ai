'use server';
/**
 * @fileOverview Generación de cápsulas de moda utilizando GPT-4o + Pinterest.
 * Se ha eliminado Shopify por restricciones de acceso.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { searchPinterestPins, PinterestPin } from '@/services/pinterest';

const WardrobeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: z.any(),
  colorimetryAnalysis: z.string(),
  figureAnalysis: z.string(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
  openaiApiKey: z.string().optional(),
  pinterestToken: z.string().optional(),
});

const CapsuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  occasion: z.string(),
  items: z.array(z.object({
    name: z.string(),
    type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
    source: z.enum(['wardrobe', 'pinterest']),
    wardrobeItemId: z.string().optional(),
    externalUrl: z.string().optional(),
    imageUrl: z.string().optional(),
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

  // 1. Análisis de Perfil y Generación de Query de Búsqueda
  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "Eres un experto en moda. Analiza el perfil y genera una query de búsqueda de 5 palabras para encontrar inspiración en Pinterest (ej: 'bohemian chic summer skin warm')." 
      },
      { 
        role: "user", 
        content: `Perfil: Figura ${input.figureAnalysis}, Colorimetría ${input.colorimetryAnalysis}. Evento: ${input.eventType}. Clima: ${input.weatherConditions}.` 
      }
    ],
    response_format: { type: "json_object" }
  });

  const queryContent = JSON.parse(analysisResponse.choices[0].message.content || '{"query": "moda elegante"}');
  const searchQuery = queryContent.query || `${input.eventType} ${input.weatherConditions} style`;

  // 2. Obtención de Inspiración de Pinterest
  const pins = await searchPinterestPins(searchQuery, input.pinterestToken);

  // 3. Construcción de Cápsula Híbrida (Armario Real + Pinterest)
  const prompt = `Eres el Stylist Maestro de Pilar Cifuentes Catalán.
DATOS DEL USUARIO: Figura ${input.figureAnalysis}, Colorimetría ${input.colorimetryAnalysis}.
ARMARIO REAL DEL USUARIO: ${JSON.stringify(input.wardrobeItems)}
INSPIRACIÓN VISUAL (PINTEREST): ${JSON.stringify(pins)}

INSTRUCCIONES:
1. Crea 2 cápsulas de 4 prendas cada una para el evento "${input.eventType}" con clima "${input.weatherConditions}".
2. PRIORIDAD MÁXIMA: Usa las prendas del ARMARIO REAL siempre que sea posible.
3. Si falta una prenda clave, usa un ítem de INSPIRACIÓN PINTEREST para completar el look.
4. Devuelve un JSON estructurado según el esquema de cápsulas. No inventes prendas que no estén en el armario o en los pins si es posible, o descríbelas como sugerencias basadas en estilo.`;

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Responde solo en JSON válido siguiendo la estructura de cápsulas." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(finalResponse.choices[0].message.content || '{"capsules": []}');
  return {
    capsules: content.capsules || []
  };
}
