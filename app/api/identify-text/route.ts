import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const MAX_FIELD_LENGTH = 300;

function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Strip HTML tags and control characters
  return value.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').slice(0, MAX_FIELD_LENGTH).trim();
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: 'Terlalu banyak permintaan. Tunggu sebentar.' }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Format JSON tidak valid.' }, { status: 400 });
  }

  try {
    if (!body || typeof body !== 'object' || !body.deskripsi || !body.location) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: deskripsi or location',
      }, { status: 400 });
    }

    const { deskripsi, location, lang = 'id' } = body;

    // Validate & sanitize each description field
    if (typeof deskripsi !== 'object' || deskripsi === null) {
      return NextResponse.json({ success: false, error: 'deskripsi harus berupa objek.' }, { status: 400 });
    }

    const sanitizedDeskripsi = {
      warna:    sanitizeString(deskripsi.warna),
      mulut:    sanitizeString(deskripsi.mulut),
      ciriKhas: sanitizeString(deskripsi.ciriKhas),
      ukuran:   sanitizeString(deskripsi.ukuran),
      habitat:  sanitizeString(deskripsi.habitat),
    };
    const sanitizedLocation = sanitizeString(location);
    const sanitizedLang = String(lang).slice(0, 5) === 'en' ? 'en' : 'id';

    const result = await geminiService.identifyFishFromDescription(sanitizedDeskripsi, sanitizedLocation, sanitizedLang);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    console.error('[Identify Text API] Error:', error);
    return NextResponse.json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Gagal memproses deskripsi.',
    }, { status: 500 });
  }
}
