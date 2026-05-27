import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';

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
    const speciesA = cleanStr(body.speciesA).slice(0, 100);
    const speciesB = cleanStr(body.speciesB).slice(0, 100);
    const lang = body.lang ? cleanStr(body.lang).slice(0, 10) : 'id';

    if (!speciesA || !speciesB) {
      return NextResponse.json({ success: false, error: 'Kedua nama spesies harus diisi.' }, { status: 400 });
    }

    const result = await geminiService.compareSpecies(speciesA, speciesB, lang || 'id');
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Compare API] Error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan saat memproses perbandingan dengan AI.' }, { status: 500 });
  }
}
