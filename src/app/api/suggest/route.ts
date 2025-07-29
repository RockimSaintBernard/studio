import { suggestInvoiceItems, type SuggestInvoiceItemsInput } from '@/ai/flows/suggest-invoice-items';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body: SuggestInvoiceItemsInput = await req.json();
    const result = await suggestInvoiceItems(body);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("API Suggestion Error:", e);
    return NextResponse.json({ error: 'Failed to get suggestions. Please try again.' }, { status: 500 });
  }
}
