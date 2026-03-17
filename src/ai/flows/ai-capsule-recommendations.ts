'use server';
/**
 * @fileOverview A Genkit flow for generating personalized outfit 'capsule' recommendations.
 * Now generates custom fashion images for shop items using AI to ensure visual accuracy.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WardrobeItemSchema = z.object({
  id: z.string().describe('Unique ID of the wardrobe item.'),
  name: z.string().describe('The name of the clothing item (e.g., "Blue Jeans").'),
  type: z.string().describe('The type of clothing item (e.g., "top", "bottom", "dress", "outerwear", "shoe", "accessory").'),
  imageDataUri: z.string().describe('A photo of the clothing item, as a data URI.'),
});
export type WardrobeItem = z.infer<typeof WardrobeItemSchema>;

const StylePreferencesSchema = z.object({
  favoriteColors: z.array(z.string()).describe('A list of the user\'s favorite colors.'),
  preferredStyles: z.array(z.string()).describe('A list of preferred fashion styles.'),
  dislikedStyles: z.array(z.string()).describe('A list of disliked fashion styles.'),
  bodyPartsToAccentuate: z.array(z.string()).describe('Specific body parts the user wants to highlight.'),
  bodyPartsToMinimize: z.array(z.string()).describe('Specific body parts the user wants to deemphasize.'),
  occasionPreferences: z.array(z.string()).describe('Types of occasions the user dresses for most often.'),
});
export type StylePreferences = z.infer<typeof StylePreferencesSchema>;

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: StylePreferencesSchema,
  colorimetryAnalysis: z.string(),
  figureAnalysis: z.string(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
});
export type AICapsuleRecommendationsInput = z.infer<typeof AICapsuleRecommendationsInputSchema>;

const CapsuleItemSchema = z.object({
  name: z.string().describe('The name of the clothing item.'),
  type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']).describe('The category of the item.'),
  source: z.enum(['wardrobe', 'shop']).describe('Whether it is from wardrobe or suggested.'),
  wardrobeItemId: z.string().optional().describe('If from wardrobe, the EXACT ID of the selected item from the list.'),
  shopLink: z.string().optional().describe('URL to purchase if shop item.'),
  styleHint: z.string().describe('EXACTLY 2 WORDS in English for image generation. (e.g., "white sneakers").'),
  imageDataUri: z.string().optional().describe('The AI-generated image for shop items.'),
});
export type CapsuleItem = z.infer<typeof CapsuleItemSchema>;

const CapsuleSchema = z.object({
  name: z.string().describe('Name for the capsule.'),
  description: z.string().describe('Detailed explanation of the look.'),
  occasion: z.string().describe('Suitable occasion and weather.'),
  items: z.array(CapsuleItemSchema),
});
export type Capsule = z.infer<typeof CapsuleSchema>;

const AICapsuleRecommendationsOutputSchema = z.object({
  capsules: z.array(CapsuleSchema),
});
export type AICapsuleRecommendationsOutput = z.infer<typeof AICapsuleRecommendationsOutputSchema>;

export async function receiveAICapsuleRecommendations(input: AICapsuleRecommendationsInput): Promise<AICapsuleRecommendationsOutput> {
  return aiCapsuleRecommendationsFlow(input);
}

const aiCapsuleRecommendationsPrompt = ai.definePrompt({
  name: 'aiCapsuleRecommendationsPrompt',
  input: { schema: AICapsuleRecommendationsInputSchema },
  output: { schema: AICapsuleRecommendationsOutputSchema },
  prompt: `You are an expert image consultant for Pilar Cifuentes Catalán. Generate 2 personalized outfit 'capsules' (total 2 capsules for performance).

For each capsule:
1. Prioritize items from the user's wardrobe.
2. If using a wardrobe item, return the EXACT 'wardrobeItemId' from the list provided.
3. If recommending a NEW item (shop), provide EXACTLY 2 WORDS for 'styleHint' in ENGLISH ONLY (e.g., "leather belt", "white sneakers").
4. Shop links should be Google Shopping search URLs for Spain.

User Style: {{stylePreferences.preferredStyles}}, Colors: {{stylePreferences.favoriteColors}}.
Event: {{eventType}}, Weather: {{weatherConditions}}.

Wardrobe:
{{#each wardrobeItems}}
- ID: {{id}}, Name: {{name}}, Type: {{type}}
{{/each}}`
});

const aiCapsuleRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiCapsuleRecommendationsFlow',
    inputSchema: AICapsuleRecommendationsInputSchema,
    outputSchema: AICapsuleRecommendationsOutputSchema,
  },
  async (input) => {
    const {output} = await aiCapsuleRecommendationsPrompt(input);
    const result = output!;

    // Generate high-quality fashion images for shop items using Imagen
    for (const capsule of result.capsules) {
      for (const item of capsule.items) {
        if (item.source === 'shop' && item.styleHint) {
          try {
            const imageResponse = await ai.generate({
              model: 'googleai/imagen-4.0-fast-generate-001',
              prompt: `A high-quality, professional studio catalog photo of a single ${item.styleHint}. Clean white background, high-end fashion aesthetic, centered, realistic lighting.`,
            });
            if (imageResponse.media?.url) {
              item.imageDataUri = imageResponse.media.url;
            }
          } catch (e) {
            console.error('Error generating fashion image:', e);
          }
        }
      }
    }

    return result;
  }
);
