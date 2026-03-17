'use server';
/**
 * @fileOverview A Genkit flow for generating personalized outfit 'capsule' recommendations.
 *
 * - receiveAICapsuleRecommendations - A function that handles the generation of outfit capsules.
 * - AICapsuleRecommendationsInput - The input type for the receiveAICapsuleRecommendations function.
 * - AICapsuleRecommendationsOutput - The return type for the receiveAICapsuleRecommendations function.
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
  styleHint: z.string().describe('EXACTLY 2 WORDS in English for image search. MANDATORY for shop items. (e.g., "leather belt", "white sneakers", "blue denim").'),
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
  prompt: `You are an expert image consultant for Pilar Cifuentes Catalán. Generate 3 personalized outfit 'capsules'.

For each capsule:
1. Prioritize items from the user's wardrobe.
2. If using a wardrobe item, return the EXACT 'wardrobeItemId' from the list provided.
3. If recommending a NEW item (shop), suggest retailers like Zara, Mango, or Primark.
4. CRITICAL: For shop items, provide EXACTLY 2 WORDS for 'styleHint' in ENGLISH ONLY. This is used by our system to find the correct image. (e.g., "leather belt", "white sneakers", "black blazer", "silk scarf"). NEVER use more than two words. NEVER use Spanish for this field.
5. Do NOT mix multiple items in one single entry (e.g., do not suggest "jeans and glasses", create two separate items).
6. Shop links should be Google Shopping search URLs for Spain. Format: https://www.google.com/search?q=zara+[item+description]+site:es&tbm=shop

User Style Preferences:
- Preferred: {{stylePreferences.preferredStyles}}
- Colors: {{stylePreferences.favoriteColors}}
- Body Focus: {{stylePreferences.bodyPartsToAccentuate}}
- Request Event: {{eventType}}
- Weather: {{weatherConditions}}

Wardrobe Items Available (USE THESE IDs ONLY for wardrobe source):
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
    return output!;
  }
);
