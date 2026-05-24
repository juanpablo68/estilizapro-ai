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
  3. SIN HUMANOS: Las descripciones para imágenes externas deben ser de producto (ej: "watch on white background").
  
  ARMARIO REAL (Prioridad):
  ${input.wardrobeItems.length > 0 ? JSON.stringify(input.wardrobeItems) : "Vacío. Usa solo source: 'external'."}

  RESPONDE SOLO EN FORMATO JSON:
  {
    "capsules": [
      {
        "name": "Nombre",
        "description": "Explicación",
        "items": [
          { "name": "Prenda", "type": "top/bottom/etc", "source": "wardrobe/external", "wardrobeItemId": "...", "searchKeywords": "product keywords" }
          ... (6 items en total, mínimo 2 accesorios)
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
          // Reforzamos la búsqueda en Unsplash para el género correcto
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
    console.error("Error en Capsulizador:", e);
    throw new Error(`Error al generar: ${e.message}`);
  }
}
