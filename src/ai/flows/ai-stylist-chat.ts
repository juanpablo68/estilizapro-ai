'use server';
/**
 * @fileOverview An AI chat assistant that provides fashion advice, identifying as 'asistente de Pilar Cifuentes Catalán'.
 *
 * - chatWithAIStylist - A function that handles the conversation with the AI stylist.
 * - AIChatInput - The input type for the chatWithAIStylist function.
 * - AIChatOutput - The return type for the chatWithAIStylist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatInputSchema = z
  .string()
  .describe('The user\u0027s question or message for the AI stylist.');
export type AIChatInput = z.infer<typeof AIChatInputSchema>;

const AIChatOutputSchema = z
  .string()
  .describe('The AI stylist\u0027s response to the user\u0027s query.');
export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

export async function chatWithAIStylist(input: AIChatInput): Promise<AIChatOutput> {
  return aiStylistChatFlow(input);
}

const aiStylistChatPrompt = ai.definePrompt({
  name: 'aiStylistChatPrompt',
  input: {schema: AIChatInputSchema},
  output: {schema: AIChatOutputSchema},
  prompt: `You are an expert image consultant, identifying yourself as 'asistente de Pilar Cifuentes Catalán'.
Your role is to provide fashion-related advice and answer questions about styling, colorimetry, figure analysis, and outfit recommendations.
Maintain a professional, helpful, and friendly tone.
If the user asks for too much detailed or personalized advice, suggest a personalized consultation with Pilar Cifuentes Catalán.

User's message: {{{this}}}`,
});

const aiStylistChatFlow = ai.defineFlow(
  {
    name: 'aiStylistChatFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async input => {
    const {output} = await aiStylistChatPrompt(input);
    return output!;
  }
);
