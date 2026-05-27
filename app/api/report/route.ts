import { NextResponse } from 'next/server';
import { saveReport } from '@/lib/firestore';
import { geminiService } from '@/lib/gemini';
import { ReportData } from '@/lib/types';

// Per-minute rate limit: max 3 per minute per IP
const rateLimitMinute = new Map<string, { count: number, resetTime: number }>();
// Per-hour rate limit: max 10 per hour per IP
const rateLimitHour = new Map<string, { count: number, resetTime: number }>();

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

// Indonesia bounding box (roughly)
const INDONESIA_BOUNDS = { latMin: -11, latMax: 6, lngMin: 95, lngMax: 141 };

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const now = Date.now();

    // --- Per-minute limit (3/min) ---
    const perMin = rateLimitMinute.get(ip);
    if (perMin && now < perMin.resetTime) {
      if (perMin.count >= 3) {
        return NextResponse.json(
          { success: false, error: 'Terlalu banyak laporan. Silakan tunggu 1 menit sebelum mengirim lagi.' },
          { status: 429 }
        );
      }
      perMin.count += 1;
    } else {
      rateLimitMinute.set(ip, { count: 1, resetTime: now + 60_000 });
    }

    // --- Per-hour limit (10/hour) ---
    const perHour = rateLimitHour.get(ip);
    if (perHour && now < perHour.resetTime) {
      if (perHour.count >= 10) {
        return NextResponse.json(
          { success: false, error: 'Batas laporan harian tercapai (10 laporan/jam). Coba lagi nanti.' },
          { status: 429 }
        );
      }
      perHour.count += 1;
    } else {
      rateLimitHour.set(ip, { count: 1, resetTime: now + 3_600_000 });
    }

    // Clean up old entries periodically
    if (Math.random() < 0.1) {
      for (const [key, value] of rateLimitMinute.entries()) {
        if (now > value.resetTime) rateLimitMinute.delete(key);
      }
      for (const [key, value] of rateLimitHour.entries()) {
        if (now > value.resetTime) rateLimitHour.delete(key);
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format JSON tidak valid.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Body harus berupa objek JSON.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.speciesName || !body.locationName || body.quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Mandatory fields are missing (speciesName, locationName, quantity)' },
        { status: 400 }
      );
    }

    // Sanitize strings (strip HTML tags) and limit lengths
    const speciesName = stripHtml(String(body.speciesName)).slice(0, 100);
    const locationName = stripHtml(String(body.locationName)).slice(0, 200);

    // Length validation
    if (speciesName.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Nama spesies harus minimal 3 karakter.' },
        { status: 400 }
      );
    }
    if (locationName.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Nama lokasi harus minimal 3 karakter.' },
        { status: 400 }
      );
    }

    // Quantity range
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 9999) {
      return NextResponse.json(
        { success: false, error: 'Jumlah harus antara 1–9999.' },
        { status: 400 }
      );
    }

    // Coordinate validation (must be within Indonesia bounds if provided)
    if (body.latitude !== undefined && body.longitude !== undefined) {
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < INDONESIA_BOUNDS.latMin || lat > INDONESIA_BOUNDS.latMax ||
        lng < INDONESIA_BOUNDS.lngMin || lng > INDONESIA_BOUNDS.lngMax
      ) {
        return NextResponse.json(
          { success: false, error: 'Koordinat di luar wilayah Indonesia.' },
          { status: 400 }
        );
      }
    }

    // Validate imageUrl size - reject if > 270KB base64
    if (body.imageUrl && String(body.imageUrl).length > 270000) {
      return NextResponse.json(
        { success: false, error: 'Ukuran foto terlalu besar. Kompresi otomatis gagal, coba foto lain.' },
        { status: 413 }
      );
    }

    const reportData: ReportData = {
      speciesName,
      scientificName: stripHtml(String(body.scientificName || '')).slice(0, 100),
      invasiveStatus: stripHtml(String(body.invasiveStatus || 'UNKNOWN')).slice(0, 50),
      locationName,
      latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
      longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
      quantity,
      waterCondition: stripHtml(String(body.waterCondition || 'Unknown')).slice(0, 50),
      reporterInitial: stripHtml(String(body.reporterInitial || 'Anon')).slice(0, 10),
      reportedAt: new Date(),
      urgency: stripHtml(String(body.urgency || 'SEDANG')).slice(0, 50),
    };

    if (body.imageUrl) {
      reportData.imageUrl = String(body.imageUrl);
    }

    // Save to Firestore
    const reportId = await saveReport(reportData);

    // Generate formatted report via Gemini
    const formattedReport = await geminiService.generateReport(
      reportData.speciesName,
      reportData.scientificName || '',
      reportData.invasiveStatus || 'UNKNOWN',
      reportData.locationName,
      reportData.quantity,
      reportData.waterCondition || 'Unknown'
    );

    return NextResponse.json(
      { success: true, reportId, formattedReport },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Report API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit report', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
