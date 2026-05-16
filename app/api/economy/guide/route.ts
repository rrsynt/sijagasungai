import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { findSpeciesByName } from '@/lib/species-database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { speciesId, pathway, lang } = body;

    if (!speciesId || !pathway) {
      return NextResponse.json({ success: false, error: 'speciesId and pathway are required' }, { status: 400 });
    }

    const species = findSpeciesByName(speciesId);
    if (!species) {
      return NextResponse.json({ success: false, error: 'Species not found in database' }, { status: 404 });
    }

    const guideResult = await geminiService.generateProcessingGuide(
      species.id,
      pathway,
      lang || 'id'
    );

    return NextResponse.json({ success: true, data: guideResult }, { status: 200 });
  } catch (error: any) {
    console.error('[Economy Guide API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate guide', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
