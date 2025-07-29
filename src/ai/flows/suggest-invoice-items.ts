// src/ai/flows/suggest-invoice-items.ts

/**
 * @fileOverview This file defines a Genkit flow for suggesting invoice items based on keywords.
 *
 * - suggestInvoiceItems - A function that takes keywords as input and returns suggested descriptions and amounts for invoice items.
 * - SuggestInvoiceItemsInput - The input type for the suggestInvoiceItems function.
 * - SuggestInvoiceItemsOutput - The output type for the suggestInvoiceItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInvoiceItemsInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords related to the product or service for the invoice item.'),
});
export type SuggestInvoiceItemsInput = z.infer<typeof SuggestInvoiceItemsInputSchema>;

const SuggestInvoiceItemsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      description: z.string().describe('Suggested description for the invoice item.'),
      amount: z.number().describe('Suggested amount for the invoice item.'),
    })
  ).describe('An array of suggested descriptions and amounts.'),
});
export type SuggestInvoiceItemsOutput = z.infer<typeof SuggestInvoiceItemsOutputSchema>;

export async function suggestInvoiceItems(input: SuggestInvoiceItemsInput): Promise<SuggestInvoiceItemsOutput> {
  return suggestInvoiceItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInvoiceItemsPrompt',
  input: {schema: SuggestInvoiceItemsInputSchema},
  output: {schema: SuggestInvoiceItemsOutputSchema},
  prompt: `You are an invoice assistant that suggests descriptions and amounts for invoice items based on keywords.

  Based on the following keywords, suggest three different descriptions and amounts for invoice items. Return the description and amount as a JSON array.

  Keywords: {{{keywords}}}

  Format the amount to 2 decimal places.
  `,
});

const suggestInvoiceItemsFlow = ai.defineFlow(
  {
    name: 'suggestInvoiceItemsFlow',
    inputSchema: SuggestInvoiceItemsInputSchema,
    outputSchema: SuggestInvoiceItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
