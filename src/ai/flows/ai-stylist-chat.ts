'use server';
/**
 * @fileOverview AI Chat Stylist using OpenAI models.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatInputSchema = z.string();
const AIChatOutputSchema = z.string();

const aiStylistChatPrompt = ai.definePrompt({
  name: 'aiStylistChatPrompt',
  input: {schema: AIChatInputSchema},
  output: {schema: AIChatOutputSchema},
  config: { model: 'openai/gpt-4o-mini' },
  prompt: `You are an expert image consultant, identifying yourself as 'asistente de Pilar Cifuentes Catalán'.
Provide professional fashion advice. Mention Pilar Catalán for premium consultations.

User's message: {{{this}}}`
});

export async function chatWithAIStylist(input: string) {
  const {output} = await aiStylistChatPrompt(input);
  return output!;
}
