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
  type: z.string().describe('The type of clothing item (e.g., "top", "bottom", "dress", "outerwear", "accessory").'),
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
  wardrobeItemId: z.string().optional().describe('If from wardrobe, the ID of the selected item.'),
  shopLink: z.string().optional().describe('URL to purchase if shop item.'),
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
  prompt: `You are an expert image consultant. Generate a list of personalized outfit 'capsules' (complete looks).
For each capsule:
1. Use as many items from the user's wardrobe as possible.
2. If the wardrobe is used, return the correct 'wardrobeItemId' from the list below.
3. If suggesting a new item to buy, set 'source' to 'shop' and leave 'wardrobeItemId' empty.
4. Strictly use these categories for 'type': "top", "bottom", "dress", "outerwear", "shoe", "accessory".

User Details:
- Style: {{stylePreferences.preferredStyles}}
- Body: {{figureAnalysis}}, Color: {{colorimetryAnalysis}}
- Request: {{eventType}} in {{weatherConditions}}

Wardrobe Items Available (USE THESE IDs):
{{#each wardrobeItems}}
- ID: {{id}}, Name: {{name}} ({{type}})
{{media url=imageDataUri}}
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
