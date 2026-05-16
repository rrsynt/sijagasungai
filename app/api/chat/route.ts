import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LENGTH = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

// Parse multi-key pool from env — same pattern as lib/gemini.ts
function parseKeys(multiEnv: string, singleEnv: string): string[] {
  const value = process.env[multiEnv] || process.env[singleEnv] || '';
  return value.split(',').map(k => k.trim()).filter(Boolean);
}

const geminiKeys = parseKeys('GEMINI_API_KEYS', 'GEMINI_API_KEY');
let keyIdx = 0;

function nextKey(): string | null {
  if (geminiKeys.length === 0) return null;
  const key = geminiKeys[keyIdx];
  keyIdx = (keyIdx + 1) % geminiKeys.length;
  return key;
}

function getRateLimitKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(key);
  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const SYSTEM_INSTRUCTION = `Kamu adalah SiJaga, asisten virtual ramah untuk aplikasi SiJaga Sungai (Sistem Informasi dan Penjagaan Sungai).
Tugasmu adalah membantu nelayan, pemancing, atau warga biasa terkait:
1. Jenis ikan invasif (Sapu-sapu, Red Devil, Aligator Gar, dll).
2. Cara aman menangani ikan invasif.
3. Nilai ekonomi ikan invasif (misal sapu-sapu bisa jadi pakan, biogas, atau kerajinan).
4. Penjelasan fitur aplikasi SiJaga Sungai.

Gunakan bahasa yang santai, sopan, dan mudah dipahami orang awam. Jawab sesingkat mungkin tapi informatif. Gunakan emoji agar menarik.
Jika ditanya di luar topik sungai, perairan, ikan, atau lingkungan, tolak dengan sopan dan kembalikan ke topik ikan invasif.`;

export async function POST(req: Request) {
  const ip = getRateLimitKey(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Tunggu sebentar.' }, { status: 429 });
  }

  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Pesan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.` }, { status: 400 });
    }
    if (!Array.isArray(history)) {
      return NextResponse.json({ error: 'Format history tidak valid.' }, { status: 400 });
    }

    const apiKey = nextKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Layanan AI sedang tidak tersedia. Coba lagi nanti.' }, { status: 503 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Limit history to last N messages to avoid token overflow
    const trimmedHistory = history.slice(-MAX_HISTORY_LENGTH);
    const contents = trimmedHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(msg.parts?.[0]?.text ?? '') }],
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    return NextResponse.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
