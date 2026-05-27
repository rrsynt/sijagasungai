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
let geminiIdx = 0;

interface OAIProvider { name: string; baseUrl: string; keys: string[]; model: string; extraHeaders?: Record<string, string>; }
const oaiProviders: OAIProvider[] = [
  { name: 'Groq',       baseUrl: 'https://api.groq.com/openai/v1',  keys: parseKeys('GROQ_API_KEYS', 'GROQ_API_KEY'),             model: 'llama-3.3-70b-versatile' },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1',    keys: parseKeys('OPENROUTER_API_KEYS', 'OPENROUTER_API_KEY'), model: 'google/gemini-2.0-flash-exp:free', extraHeaders: { 'HTTP-Referer': 'https://sijaga-sungai.app', 'X-Title': 'SiJaga Sungai' } },
  { name: 'Hyperbolic', baseUrl: 'https://api.hyperbolic.xyz/v1',   keys: parseKeys('HYPERBOLIC_API_KEYS', 'HYPERBOLIC_API_KEY'), model: 'meta-llama/Llama-3.3-70B-Instruct' },
].filter(p => p.keys.length > 0);

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

async function callFallbackChain(history: ChatMessage[], message: string): Promise<{ text: string; providerName: string }> {
  if (oaiProviders.length === 0) throw new Error('NO_FALLBACK_PROVIDER');

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

  for (const provider of oaiProviders) {
    let allExhausted = true;
    for (const key of provider.keys) {
      try {
        const res = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            ...provider.extraHeaders,
          },
          body: JSON.stringify({ model: provider.model, messages, temperature: 0.7, max_tokens: 512 }),
        });
        if (res.status === 429) continue;
        if (!res.ok) { const t = await res.text(); throw new Error(`${provider.name} ${res.status}: ${t}`); }
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error(`Empty response from ${provider.name}`);
        console.log(`[Chat] Fallback via ${provider.name}`);
        return { text, providerName: provider.name };
      } catch (e: any) {
        if (!String(e?.message).includes('429')) { allExhausted = false; throw e; }
      }
    }
    if (allExhausted) console.warn(`[Chat] ${provider.name} all keys rate-limited — trying next provider`);
  }
  throw new Error('All fallback providers exhausted');
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Tunggu sebentar.' }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format JSON tidak valid.' }, { status: 400 });
  }

  try {
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body harus berupa objek JSON.' }, { status: 400 });
    }

    const { message: rawMessage, history: rawHistory } = body;

    if (!rawMessage || typeof rawMessage !== 'string') {
      return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 });
    }
    if (rawMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Pesan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.` }, { status: 400 });
    }
    if (!Array.isArray(rawHistory)) {
      return NextResponse.json({ error: 'Format history tidak valid.' }, { status: 400 });
    }

    const cleanStr = (val: unknown) => String(val || '').replace(/<[^>]*>/g, '').trim();
    const message = cleanStr(rawMessage);

    const history: ChatMessage[] = rawHistory.map(item => {
      const role = item?.role === 'user' ? 'user' : 'model';
      const text = cleanStr(item?.parts?.[0]?.text).slice(0, MAX_MESSAGE_LENGTH);
      return {
        role,
        parts: [{ text }]
      };
    });

    let text: string;
    let modelName = 'Gemini AI';
    try {
      const contents = buildContents(history, message);
      text = await callGemini(contents);
      modelName = 'Gemini AI';
    } catch (geminiErr: any) {
      const is429 = geminiErr?.status === 429 || String(geminiErr?.message).includes('429') ||
        String(geminiErr?.message).includes('RESOURCE_EXHAUSTED') || geminiErr?.message === 'NO_GEMINI_KEY';
      if (is429 || geminiErr?.message === 'NO_GEMINI_KEY') {
        console.warn('[Chat] Gemini quota/unavailable — falling back to provider chain');
        const fallbackRes = await callFallbackChain(history, message);
        text = fallbackRes.text;
        modelName = `${fallbackRes.providerName} (Luring)`;
      } else {
        throw geminiErr;
      }
    }

    return NextResponse.json({ success: true, text, model: modelName });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
