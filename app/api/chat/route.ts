import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LENGTH = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function parseKeys(multiEnv: string, singleEnv: string): string[] {
  const value = process.env[multiEnv] || process.env[singleEnv] || process.env[`NEXT_PUBLIC_${singleEnv}`] || '';
  return value.split(',').map(k => k.trim()).filter(Boolean);
}

const geminiKeys = parseKeys('GEMINI_API_KEYS', 'GEMINI_API_KEY');
const groqKeys   = parseKeys('GROQ_API_KEYS',   'GROQ_API_KEY');
let geminiIdx = 0;

function nextGeminiKey(): string | null {
  if (geminiKeys.length === 0) return null;
  const key = geminiKeys[geminiIdx];
  geminiIdx = (geminiIdx + 1) % geminiKeys.length;
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

interface ChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

function buildContents(history: ChatMessage[], message: string) {
  const trimmed = history.slice(-MAX_HISTORY_LENGTH);
  const contents = trimmed.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(msg.parts?.[0]?.text ?? '') }],
  }));
  // Gemini requires contents to start with a user message
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }
  contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

async function callGemini(contents: ReturnType<typeof buildContents>): Promise<string> {
  const key = nextGeminiKey();
  if (!key) throw new Error('NO_GEMINI_KEY');
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  });
  return response.text ?? '';
}

async function callGroq(history: ChatMessage[], message: string): Promise<string> {
  if (groqKeys.length === 0) throw new Error('NO_GROQ_KEY');

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history
      .slice(-MAX_HISTORY_LENGTH)
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.parts?.[0]?.text ?? ''),
      })),
    { role: 'user', content: message },
  ];

  let lastErr: unknown;
  for (const key of groqKeys) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });
      if (res.status === 429) { lastErr = new Error('Groq 429'); continue; }
      if (!res.ok) { const t = await res.text(); throw new Error(`Groq ${res.status}: ${t}`); }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('All Groq keys failed');
}

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

    let text: string;
    try {
      const contents = buildContents(history, message);
      text = await callGemini(contents);
    } catch (geminiErr: any) {
      const is429 = geminiErr?.status === 429 || String(geminiErr?.message).includes('429') ||
        String(geminiErr?.message).includes('RESOURCE_EXHAUSTED') || geminiErr?.message === 'NO_GEMINI_KEY';
      if (is429 || geminiErr?.message === 'NO_GEMINI_KEY') {
        console.warn('[Chat] Gemini quota/unavailable — falling back to Groq');
        text = await callGroq(history, message);
      } else {
        throw geminiErr;
      }
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
