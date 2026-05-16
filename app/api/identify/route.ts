import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { findSpeciesByName } from '@/lib/species-database';
import { IdentificationResult } from '@/lib/types';

// Simple in-memory rate limiting map
// In production with multiple instances, use Redis or similar.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Clean up old timestamps
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  recentTimestamps.push(now);
  rateLimitMap.set(ip, recentTimestamps);
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi.' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const location = (formData.get('location') as string) || 'Tidak diketahui';
    const lang = ((formData.get('lang') as string) || 'id').toLowerCase();

    if (!image) {
      return NextResponse.json({ success: false, error: 'File foto tidak ditemukan.' }, { status: 400 });
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Tipe file tidak valid. Hanya menerima file gambar.' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (image.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'Ukuran foto terlalu besar. Maksimal 10MB.' }, { status: 413 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = image.type;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Identify API] Request from IP: ${ip}, Location: ${location}, Language: ${lang}`);
    }

    const result = await geminiService.identifyFish(base64, mimeType, location, lang);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Identify API] Gemini result:`, JSON.stringify(result, null, 2));
    }

    // Always return the result — let UI handle low-confidence cases
    return NextResponse.json({ success: true, data: result }, { status: 200 });

  } catch (error: any) {
    console.error('[Identify API] Error processing request:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan saat memproses gambar dengan AI.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
