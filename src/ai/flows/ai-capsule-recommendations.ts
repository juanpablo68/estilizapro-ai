'use server';
/**
 * @fileOverview A Genkit flow for generating personalized outfit 'capsule' recommendations using OpenAI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WardrobeItemSchema = z.object({
  id: z.string().describe('Unique ID of the wardrobe item.'),
  name: z.string().describe('The name of the clothing item.'),
  type: z.string().describe('The type of clothing item.'),
  imageDataUri: z.string().describe('A photo of the clothing item.'),
});

const StylePreferencesSchema = z.object({
  favoriteColors: z.array(z.string()),
  preferredStyles: z.array(z.string()),
  dislikedStyles: z.array(z.string()),
  bodyPartsToAccentuate: z.array(z.string()),
  bodyPartsToMinimize: z.array(z.string()),
  occasionPreferences: z.array(z.string()),
});

const AICapsuleRecommendationsInputSchema = z.object({
  stylePreferences: StylePreferencesSchema,
  colorimetryAnalysis: z.string(),
  figureAnalysis: z.string(),
  eventType: z.string(),
  weatherConditions: z.string(),
  wardrobeItems: z.array(WardrobeItemSchema),
});

const CapsuleItemSchema = z.object({
  name: z.string(),
  type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoe', 'accessory']),
  source: z.enum(['wardrobe', 'shop']),
  wardrobeItemId: z.string().optional(),
  shopLink: z.string().optional(),
  styleHint: z.string().describe('Exactly 2 words in English for image placeholder.'),
});

const CapsuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  occasion: z.string(),
  items: z.array(CapsuleItemSchema),
});

const AICapsuleRecommendationsOutputSchema = z.object({
  capsules: z.array(CapsuleSchema),
});

const aiCapsuleRecommendationsPrompt = ai.definePrompt({
  name: 'aiCapsuleRecommendationsPrompt',
  input: { schema: AICapsuleRecommendationsInputSchema },
  output: { schema: AICapsuleRecommendationsOutputSchema },
  config: { model: 'openai/gpt-4o' },
  prompt: `You are an expert fashion stylist. Generate 2 personalized outfit capsules.
  
Context:
- User Figure: {{figureAnalysis}}
- Color Palette: {{colorimetryAnalysis}}
- Styles: {{stylePreferences.preferredStyles}}
- Event: {{eventType}}
- Weather: {{weatherConditions}}

Wardrobe available:
{{#each wardrobeItems}}
- ID: {{id}}, Name: {{name}}, Type: {{type}}
{{/each}}

Ensure styleHints are exactly 2 words in English.`
});

export async function receiveAICapsuleRecommendations(input: any) {
  const {output} = await aiCapsuleRecommendationsPrompt(input);
  return output!;
}
