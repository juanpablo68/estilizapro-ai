'use server';
/**
 * @fileOverview Generación de cápsulas de moda con prioridad absoluta al armario local.
 * Garantiza 6 imágenes totales por outfit, con al menos 2 accesorios.
 * REGLA DE ORO: Blindaje de género absoluto.
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
    searchKeywords: z.string().describe('English keywords for Unsplash: e.g. "luxury leather watch"'),
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
  
  // FUENTE DE VERDAD: El género pasado desde el frontend (que viene del perfil del usuario)
  const genderContext = input.gender || 'Femenino';

  const prompt = `Actúa como el Stylist Maestro de Pilar Catalán. 
  Crea exactamente 1 outfit coordinado para: "${input.eventType}" en clima: "${input.weatherConditions}".

  REGLA DE ORO DE IDENTIDAD (CRÍTICA):
  El usuario es ${genderContext.toUpperCase()}. 
  Si el género es "MASCULINO", el outfit DEBE ser EXCLUSIVAMENTE para HOMBRE. 
  ESTÁ TERMINANTEMENTE PROHIBIDO incluir vestidos (dresses), faldas o blusas de corte femenino si el género es Masculino. 
  Solo usa pantalones, camisas de hombre, poleras de hombre, chaquetas de hombre y zapatos de hombre.

  REGLAS DE COMPOSICIÓN:
  1. El outfit DEBE tener exactamente 6 elementos en total.
  2. ACCESORIOS: Es OBLIGATORIO que incluyas por lo menos 2 accesorios (type: "accessory").
  
  ARMARIO REAL DEL CLIENTE (MÁXIMA PRIORIDAD):
  ${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío."}

  REGLA DE COMBINACIÓN ESTRICTA (CRÍTICA, OBLIGATORIA):
  De los 6 elementos del outfit coordinado, EXACTAMENTE 3 de ellos DEBEN ser elegidos de la lista del "ARMARIO REAL DEL CLIENTE" anterior.
  Para cada uno de estos 3 elementos elegidos de su armario:
  - Su campo "source" DEBE ser "wardrobe".
  - Su campo "wardrobeItemId" DEBE ser el "id" exacto correspondiente de la prenda seleccionada del armario.
  - Sus campos "name" y "type" deben coincidir exactamente con los de esa prenda.
  
  Los otros 3 elementos del outfit DEBEN ser prendas/accesorios nuevos sugeridos externamente:
  - Su campo "source" DEBE ser "external".
  - Su campo "wardrobeItemId" debe ser omitido o nulo.
  - Estos 3 elementos sugeridos deben ser prendas/accesorios nuevos que complementen y combinen de forma excelente con los 3 artículos seleccionados del armario.
  
  SIN HUMANOS EN LAS IMÁGENES SUGERIDAS (CRÍTICO):
  Las "searchKeywords" para los 3 elementos externos sugeridos deben estar en INGLÉS y describir la prenda en formato de fotografía de catálogo o producto limpio, "flat lay", "ghost mannequin" o "studio shot" sobre fondo neutro/blanco, especificando el género ("mens" o "womens") para evitar que aparezcan personas posando, rostros o partes del cuerpo humano.
  Ejemplos excelentes de "searchKeywords":
  - "mens white minimalist sneaker isolated product shot"
  - "womens red leather handbag flat lay catalog"
  - "mens blue denim jeans flat lay product photography"
  - "womens black blazer studio shot on white background"
  NUNCA uses palabras que inciten a mostrar personas posando.

  RESPONDE SOLO EN FORMATO JSON:
  {
    "capsules": [
      {
        "name": "Nombre",
        "description": "Explicación",
        "items": [
          { "name": "Prenda", "type": "top/bottom/etc", "source": "wardrobe/external", "wardrobeItemId": "...", "searchKeywords": "product keywords" }
          ... (6 items en total, 3 de armario y 3 externos, mínimo 2 accesorios en el outfit completo)
        ]
      }
    ]
  }`;

  try {
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Experto en estilismo profesional y fotografía de producto." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = finalResponse.choices[0].message.content || '{"capsules": []}';
    const content = JSON.parse(responseText);
    const date = new Date().toISOString();
    
    if (!content.capsules || !Array.isArray(content.capsules)) {
      throw new Error("Respuesta inválida de la IA.");
    }

    const processedCapsules = await Promise.all(content.capsules.map(async (capsule: any, cIdx: number) => {
      const processedItems = await Promise.all((capsule.items || []).map(async (item: any) => {
        let imageUrl = undefined;

        if (item.source === 'external') {
          const uKey = getUnsplashKey(input.unsplashAccessKey);
          // La IA ya incluye los términos de género correctos e instrucciones de exclusión en searchKeywords
          const query = item.searchKeywords;
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
    console.error("Error en Capsulizador:", e);
    throw new Error(`Error al generar: ${e.message}`);
  }
}
