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
  name: z.string().describe('The name of the clothing item (e.g., "Blue Jeans").'),
  type: z.string().describe('The type of clothing item (e.g., "top", "bottom", "dress", "outerwear", "accessory").'),
  imageDataUri: z.string().describe('A photo of the clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: "data:<mimetype>;base64,<encoded_data>".'),
});
export type WardrobeItem = z.infer<typeof WardrobeItemSchema>;

const StylePreferencesSchema = z.object({
  favoriteColors: z.array(z.string()).describe('A list of the user\u0027s favorite colors (e.g., ["blue", "green"]).'),
  preferredStyles: z.array(z.string()).describe('A list of preferred fashion styles (e.g., ["minimalist", "bohemian", "classic"]).'),
  dislikedStyles: z.array(z.string()).describe('A list of disliked fashion styles.'),
  bodyPartsToAccentuate: z.array(z.string()).describe('Specific body parts the user wants to highlight (e.g., ["waist", "legs"]).'),
  bodyPartsToMinimize: z.array(z.string()).describe('Specific body parts the user wants to deemphasize (e.g., ["hips", "shoulders"]).'),
  occasionPreferences: z.array(z.string()).describe('Types of occasions the user dresses for most often (e.g., ["work", "casual weekend", "evening events"]).'),
});
export type StylePreferences = z.infer<typeof StylePreferencesSchema>;

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: StylePreferencesSchema.describe('User\u0027s detailed style preferences from a questionnaire.'),
  colorimetryAnalysis: z.string().describe('Result of user\u0027s colorimetry analysis (e.g., "Warm Autumn", "Cool Summer").'),
  figureAnalysis: z.string().describe('Result of user\u0027s figure analysis (e.g., "Hourglass", "Rectangle", "Apple").'),
  eventType: z.string().describe('The specific event type for which recommendations are needed (e.g., "casual outing", "business meeting", "party").'),
  weatherConditions: z.string().describe('Current or anticipated weather conditions (e.g., "sunny and warm", "rainy and cold", "snowy").'),
  wardrobeItems: z.array(WardrobeItemSchema).describe('A list of clothing items currently available in the user\u0027s virtual wardrobe, each with an image.'),
});
export type AICapsuleRecommendationsInput = z.infer<typeof AICapsuleRecommendationsInputSchema>;

const CapsuleItemSchema = z.object({
  name: z.string().describe('The name of the clothing item in the capsule (e.g., "White T-shirt").'),
  type: z.string().describe('The type of clothing item (e.g., "top", "bottom", "shoe", "accessory").'),
  source: z.enum(['wardrobe', 'shop']).describe('Indicates whether the item is from the user\u0027s wardrobe or a suggested shop item.'),
  imageDataUri: z.string().describe('If from wardrobe, a data URI of the item\u0027s image. If from shop, a descriptive text for the item, which can be used to search/generate an image (e.g., "classic blue denim jacket", "strappy black heels").'),
  shopLink: z.string().optional().describe('Optional: A URL to purchase the item if it\u0027s a suggested shop item.'),
});
export type CapsuleItem = z.infer<typeof CapsuleItemSchema>;

const CapsuleSchema = z.object({
  name: z.string().describe('A descriptive name for the outfit capsule (e.g., "Everyday Chic", "Business Casual").'),
  description: z.string().describe('A detailed description of the capsule, explaining why these items work together and for the given occasion/conditions.'),
  occasion: z.string().describe('The specific occasion and weather conditions this capsule is suitable for.'),
  items: z.array(CapsuleItemSchema).describe('A list of clothing items that form this capsule.'),
});
export type Capsule = z.infer<typeof CapsuleSchema>;

const AICapsuleRecommendationsOutputSchema = z.object({
  capsules: z.array(CapsuleSchema).describe('A list of personalized outfit capsules based on the input criteria.'),
});
export type AICapsuleRecommendationsOutput = z.infer<typeof AICapsuleRecommendationsOutputSchema>;

export async function receiveAICapsuleRecommendations(input: AICapsuleRecommendationsInput): Promise<AICapsuleRecommendationsOutput> {
  return aiCapsuleRecommendationsFlow(input);
}

const aiCapsuleRecommendationsPrompt = ai.definePrompt({
  name: 'aiCapsuleRecommendationsPrompt',
  input: { schema: AICapsuleRecommendationsInputSchema },
  output: { schema: AICapsuleRecommendationsOutputSchema },
  prompt: `You are an expert image consultant, specialized in personal styling, colorimetry, and figure analysis, helping users build personalized outfit capsules.\n\nBased on the following user data, generate a list of outfit 'capsules'. Each capsule should be a complete outfit suitable for the specified event type and weather conditions.\nIf the user's wardrobe items are insufficient to create a complete and stylish capsule, you MUST suggest complementary shop items. For shop items, provide a descriptive text for the 'imageDataUri' field, which can be used to later search for or generate an image.\n\nHere are the user's details:\n\n1.  **Style Preferences:**\n    - Favorite Colors: {{#each stylePreferences.favoriteColors}} "{{this}}" {{/each}}\n    - Preferred Styles: {{#each stylePreferences.preferredStyles}} "{{this}}" {{/each}}\n    - Disliked Styles: {{#each stylePreferences.dislikedStyles}} "{{this}}" {{/each}}\n    - Body Parts to Accentuate: {{#each stylePreferences.bodyPartsToAccentuate}} "{{this}}" {{/each}}\n    - Body Parts to Minimize: {{#each stylePreferences.bodyPartsToMinimize}} "{{this}}" {{/each}}\n    - Occasion Preferences: {{#each stylePreferences.occasionPreferences}} "{{this}}" {{/each}}\n\n2.  **Body Analysis:**\n    - Colorimetry Analysis: "{{colorimetryAnalysis}}"\n    - Figure Analysis: "{{figureAnalysis}}"\n\n3.  **Current Request:**\n    - Event Type: "{{eventType}}"\n    - Weather Conditions: "{{weatherConditions}}"\n\n4.  **User's Wardrobe Items (with images where available):**\n    {{#each wardrobeItems}}\n    - Name: "{{name}}", Type: "{{type}}"\n      {{media url=imageDataUri}}\n    {{/each}}\n\nStrictly adhere to the provided JSON schema for the output.`
});

const aiCapsuleRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiCapsuleRecommendationsFlow',
    inputSchema: AICapsuleRecommendationsInputSchema,
    outputSchema: AICapsuleRecommendationsOutputSchema,
  },
  async (input) => {
    // The Gemini 2.5 Flash model handles multimodal input directly when defined in the prompt.
    const {output} = await aiCapsuleRecommendationsPrompt(input);
    return output!;
  }
);
