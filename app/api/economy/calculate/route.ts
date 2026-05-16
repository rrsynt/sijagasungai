import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { findSpeciesByName } from '@/lib/species-database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { speciesId, quantityKg, location, lang } = body;

    if (!speciesId) {
      return NextResponse.json({ success: false, error: 'speciesId is required' }, { status: 400 });
    }

    if (quantityKg === undefined || quantityKg <= 0 || quantityKg >= 1000) {
      return NextResponse.json(
        { success: false, error: 'quantityKg must be strictly greater than 0 and less than 1000' },
        { status: 400 }
      );
    }

    const species = findSpeciesByName(speciesId);
    if (!species) {
      return NextResponse.json({ success: false, error: 'Species not found in database' }, { status: 404 });
    }

    const economyResult = await geminiService.calculateEconomy(
      species.id,
      quantityKg,
      location || 'Indonesia',
      lang || 'id'
    );

    return NextResponse.json({ success: true, data: economyResult }, { status: 200 });
  } catch (error: any) {
    console.error('[Economy Calculate API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate economy', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
