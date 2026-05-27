import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { findSpeciesByName } from '@/lib/species-database';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Format JSON tidak valid.' }, { status: 400 });
  }

  try {
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Body harus berupa objek JSON.' }, { status: 400 });
    }

    const cleanStr = (val: unknown) => String(val || '').replace(/<[^>]*>/g, '').trim();
    const speciesId = cleanStr(body.speciesId).slice(0, 100);
    const location = body.location ? cleanStr(body.location).slice(0, 200) : 'Indonesia';
    const lang = body.lang ? cleanStr(body.lang).slice(0, 10) : 'id';
    const quantityKg = body.quantityKg;

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
