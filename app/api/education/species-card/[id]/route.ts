import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { findSpeciesByName } from '@/lib/species-database';
import { unstable_cache } from 'next/cache';

const getCachedEducationCard = unstable_cache(
  async (speciesId: string, ageGroup: string, lang: string) => {
    return await geminiService.generateEducationCard(speciesId, ageGroup, lang);
  },
  ['education-card-cache'],
  { revalidate: 3600 }
);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const ageGroup = searchParams.get('ageGroup') || 'adult';
    const lang = searchParams.get('lang') || 'id';

    const species = findSpeciesByName(id);
    if (!species) {
      return NextResponse.json({ success: false, error: 'Species not found' }, { status: 404 });
    }

    const educationCard = await getCachedEducationCard(species.id, ageGroup, lang);

    // Add caching headers: 1 hour cache
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return NextResponse.json(
      { success: true, data: educationCard },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error('[Education Species Card API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate education card', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
