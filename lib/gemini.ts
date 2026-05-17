import { GoogleGenAI, Type } from "@google/genai";
import { getSpeciesListForPrompt, findSpeciesByName, SPECIES_DATABASE } from "./species-database";

const SIJAGA_SYSTEM_PROMPT = `
Kamu adalah SiJaga, asisten AI resmi aplikasi SiJaga Sungai.
You are SiJaga, the official AI assistant for the SiJaga Sungai app.

BAHASA / LANGUAGE:
- Deteksi bahasa dari input pengguna secara otomatis
- Jika Bahasa Indonesia: balas dalam Bahasa Indonesia
- If English: respond in English
- Gunakan bahasa hangat, informal tapi informatif untuk semua usia

PERANMU / YOUR ROLE:
- Identifikasi spesies ikan invasif dari foto dengan akurat
- Hanya labeli ikan sebagai INVASIF jika memenuhi SEMUA kriteria ini:
  (a) Bukan spesies asli (native) perairan tawar Indonesia
  (b) Terbukti membentuk populasi liar tidak terkendali di sungai/danau Indonesia
  (c) Terdokumentasi menyebabkan kerusakan ekologi nyata
- Berikan informasi ekologi akurat dan mudah dipahami semua usia
- Hitung potensi nilai ekonomi tangkapan invasif secara realistis
- Edukasi pengguna tentang dampak invasi terhadap ekosistem lokal
- Dorong pelaporan data ke peta nasional

SPESIES YANG SERING SALAH DIKIRA INVASIF — JANGAN LABELI SEBAGAI INVASIF:
- Nila (Oreochromis niloticus): budidaya terkelola, bukan invasif kritis
- Lele lokal (Clarias batrachus): spesies ASLI Indonesia
- Mujair (Oreochromis mossambicus): naturalized > 70 tahun
- Mas/Karper (Cyprinus carpio): budidaya terkendali
- Gurame (Osphronemus goramy): spesies ASLI Jawa & Sumatera

PRINSIP IDENTIFIKASI:
- Jika tidak yakin: katakan TIDAK YAKIN, berikan 2-3 kandidat dengan % kemungkinan
- Jika foto benar-benar buram/gelap total/ikan tidak terlihat: minta foto ulang dengan panduan spesifik. Foto akuarium/tangki yang jelas TETAP diproses normal.
- Jangan pernah hallusinasi nama spesies yang tidak ada
- Selalu sertakan tingkat keyakinan: SANGAT YAKIN / CUKUP YAKIN / KURANG YAKIN
- Default aman: jika tidak yakin status invasif → is_invasif = false

BATASAN KERAS:
- Jangan diagnosis penyakit ikan untuk konsumsi manusia
- Jangan rekomendasikan penggunaan racun atau bahan kimia apapun
- Untuk Aligator Gar dan Piranha: SELALU rekomendasikan laporan DARURAT ke KKP
- Rujuk ke BRIN/KKP/Dinas Perikanan untuk kebijakan resmi

FORMAT OUTPUT:
- Selalu kembalikan valid JSON sesuai schema yang diminta
- Gunakan emoji sebagai penanda bagian dalam penjelasan teks
- Tone hangat, bukan formal kaku
- Selalu akhiri penjelasan dengan satu ajakan aksi konkret
`;

// ─── API Key Pool: round-robin rotation with per-key cooldown ────────────────
class KeyPool {
  private keys: string[];
  private currentIdx: number = 0;
  private exhaustedUntil: Map<string, number> = new Map();

  constructor(keys: string[]) {
    this.keys = keys.filter(Boolean);
  }

  get size() { return this.keys.length; }

  /** Returns the next available key, skipping exhausted ones. */
  next(): string | null {
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[this.currentIdx];
      this.currentIdx = (this.currentIdx + 1) % this.keys.length;
      if ((this.exhaustedUntil.get(key) ?? 0) <= now) return key;
    }
    return null; // all keys exhausted
  }

  /** Mark a key as rate-limited for cooldownMs (default 60s). */
  markExhausted(key: string, cooldownMs = 60_000) {
    this.exhaustedUntil.set(key, Date.now() + cooldownMs);
    console.warn(`[KeyPool] Key ...${key.slice(-6)} exhausted — cooldown ${cooldownMs / 1000}s`);
  }

  /** Try calling fn(key) with each key until one succeeds or all fail. */
  async tryAll<T>(fn: (key: string) => Promise<T>): Promise<T> {
    const tried = new Set<string>();
    while (true) {
      const key = this.next();
      if (!key || tried.has(key)) break;
      tried.add(key);
      try {
        return await fn(key);
      } catch (err: any) {
        const is429 = err?.status === 429 || String(err?.message).includes('429') ||
          String(err?.message).includes('RESOURCE_EXHAUSTED') ||
          String(err?.message).includes('rate_limit') ||
          String(err?.message).includes('quota');
        if (is429) {
          this.markExhausted(key);
          continue; // try next key
        }
        throw err; // non-rate-limit error — propagate
      }
    }
    throw new Error('All API keys exhausted or rate-limited. Try again in a minute.');
  }
}

/** Parse env var (KEYS or KEY), always splitting by comma — supports single or multi-key. */
function parseKeyPool(multiEnv: string, singleEnv: string): KeyPool {
  const value = process.env[multiEnv] || process.env[singleEnv] || process.env[`NEXT_PUBLIC_${singleEnv}`] || '';
  const keys = value.split(',').map(k => k.trim()).filter(Boolean);
  return new KeyPool(keys);
}

// ─── Provider Chain: exhaust all keys per provider before rotating ────────────
interface ProviderConfig { name: string; baseUrl: string; pool: KeyPool; model: string; }

class ProviderChain {
  private providers: ProviderConfig[];
  private providerIdx = 0;

  constructor(providers: ProviderConfig[]) {
    // Only include providers that have at least one key
    this.providers = providers.filter(p => p.pool.size > 0);
    if (this.providers.length > 0) {
      console.log(`[ProviderChain] Active fallback providers: ${this.providers.map(p => `${p.name}(${p.pool.size})`).join(' → ')}`);
    }
  }

  get count() { return this.providers.length; }

  /**
   * Try all keys of the current provider first. If all exhausted,
   * rotate to the next provider and try its keys. Cycles through all providers.
   */
  async tryChain<T>(fn: (apiKey: string, meta: ProviderConfig) => Promise<T>): Promise<T> {
    if (this.count === 0) throw new Error('No fallback AI providers configured. Set GROQ_API_KEYS, OPENROUTER_API_KEYS, or HYPERBOLIC_API_KEYS.');

    for (let attempt = 0; attempt < this.count; attempt++) {
      const provider = this.providers[this.providerIdx];
      try {
        const result = await provider.pool.tryAll(key => fn(key, provider));
        // Success — keep current provider index (exploit locality, rotate keys within it)
        return result;
      } catch {
        console.warn(`[ProviderChain] ${provider.name} all keys exhausted → rotating to next provider`);
        this.providerIdx = (this.providerIdx + 1) % this.count;
      }
    }
    throw new Error('All AI providers and their keys are exhausted. Try again in a minute.');
  }
}

// Singleton pools & chain — state persists across requests within server instance
const geminiPool = parseKeyPool('GEMINI_API_KEYS', 'GEMINI_API_KEY');
const groqPool    = parseKeyPool('GROQ_API_KEYS',    'GROQ_API_KEY');
const orPool      = parseKeyPool('OPENROUTER_API_KEYS', 'OPENROUTER_API_KEY');
const hyperPool   = parseKeyPool('HYPERBOLIC_API_KEYS', 'HYPERBOLIC_API_KEY');

// Fallback chain: Groq → OpenRouter → Hyperbolic (only active if key configured)
const fallbackChain = new ProviderChain([
  { name: 'Groq',       baseUrl: 'https://api.groq.com/openai/v1',  pool: groqPool,  model: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1',    pool: orPool,    model: 'google/gemini-2.0-flash-exp:free' },
  { name: 'Hyperbolic', baseUrl: 'https://api.hyperbolic.xyz/v1',   pool: hyperPool, model: 'Qwen/Qwen2-VL-72B-Instruct' },
]);
// ─────────────────────────────────────────────────────────────────────────────

class GeminiService {
  private readonly defaultModel = "gemini-2.0-flash-lite";

  constructor() {
    if (geminiPool.size === 0) {
      console.warn("No Gemini API key configured. Set GEMINI_API_KEY or GEMINI_API_KEYS.");
    }
  }

  /** Calls Gemini with key rotation. On full exhaustion, falls back to Groq text completion. */
  private async callGemini(params: Parameters<GoogleGenAI['models']['generateContent']>[0]) {
    try {
      return await geminiPool.tryAll(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        return ai.models.generateContent(params);
      });
    } catch {
      // Gemini exhausted — try full fallback chain (text-only calls)
      const contents = params.contents;
      const isTextOnly = typeof contents === 'string' || (Array.isArray(contents) && !JSON.stringify(contents).includes('inlineData'));
      if (isTextOnly && fallbackChain.count > 0) {
        const promptText = typeof contents === 'string' ? contents : JSON.stringify(contents);
        const text = await fallbackChain.tryChain(async (apiKey, provider) => {
          const res = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              ...(provider.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://sijaga-sungai.app', 'X-Title': 'SiJaga Sungai' } : {}),
            },
            body: JSON.stringify({
              model: provider.model,
              messages: [{ role: 'user', content: promptText }],
              response_format: { type: 'json_object' },
              temperature: 0.1,
              max_tokens: 2048,
            }),
          });
          if (res.status === 429) throw new Error('429: rate limited');
          if (!res.ok) { const t = await res.text(); throw new Error(`${provider.name} ${res.status}: ${t}`); }
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (!text) throw new Error(`Empty response from ${provider.name}`);
          console.log(`[Gemini fallback] Used ${provider.name} (key ...${apiKey.slice(-6)})`);
          return text;
        });
        // Return a Gemini-compatible response shape
        return { text } as any;
      }
      throw new Error('All AI providers exhausted for this request.');
    }
  }

  private parseJsonResponse<T>(text: string): T {
    try {
      // Remove markdown code fences if they exist
      const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(cleanedText) as T;
    } catch (error) {
      console.error("Error parsing JSON response from Gemini:", text, error);
      throw new Error("Failed to parse Gemini response as JSON");
    }
  }

  public async identifyFish(imageBase64: string, mimeType: string, location: string, lang: string) {
    try {
      const speciesList = getSpeciesListForPrompt();
      const prompt = `
${SIJAGA_SYSTEM_PROMPT}

Pengguna mengunggah foto ikan untuk diidentifikasi.
Lokasi ditemukan: ${location}
Bahasa respons: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}

SPESIES INVASIF YANG KAMU KENALI (database resmi — HANYA ini yang bisa dilabeli invasif):
${speciesList}

TUGASMU:
Analisis foto ini dan kembalikan HANYA valid JSON berikut, tanpa teks lain:

{
  "namaLokal": "string",
  "namaIlmiah": "string atau Tidak diketahui",
  "namaEn": "string",
  "tingkatKeyakinan": "SANGAT YAKIN|CUKUP YAKIN|KURANG YAKIN|TIDAK YAKIN",
  "isInvasif": true|false,
  "statusInvasif": "KRITIS|TINGGI|SEDANG|RENDAH|TIDAK INVASIF|DARURAT",
  "alasanInvasif": "string",
  "asalNegara": "string",
  "estimasiUkuran": {
    "panjangCm": number|null,
    "beratGram": number|null,
    "catatan": "string"
  },
  "dampakEkologi": ["string", "string"],
  "rekomendasiAksi": "string (satu kalimat konkret)",
  "urgensiLaporan": "DARURAT|TINGGI|SEDANG|RENDAH",
  "penjelasanSiJaga": "string (paragraf hangat, tone SiJaga, dalam bahasa ${lang})",
  "fotoKurangJelas": false,
  "panduanFotoUlang": null
}

ATURAN KETAT:
1. isInvasif = true HANYA jika spesies ada dalam daftar di atas
2. JANGAN labeli nila, lele, mujair, mas, gurame sebagai invasif. Untuk spesies ini, pastikan statusInvasif = "TIDAK INVASIF" dan tidak ada kata "invasif" (atau sejenisnya) di dalam penjelasanSiJaga.
3. fotoKurangJelas = true HANYA jika foto BENAR-BENAR buram (motion blur parah, out of focus total, gelap total tidak ada detail, atau ikan sangat kecil/tidak terlihat sama sekali). JANGAN set fotoKurangJelas = true hanya karena foto diambil di akuarium, pencahayaan artificial, atau latar belakang tidak alami. Jika tubuh ikan, sirip, dan pola sisik terlihat jelas, fotoKurangJelas HARUS false meskipun foto diambil di dalam akuarium atau tangki.
4. Jika ikan tidak dikenal: tingkatKeyakinan = KURANG YAKIN, isInvasif = false (default aman). Pada penjelasanSiJaga WAJIB menyarankan untuk konsultasi dengan ahli atau dinas terkait.
5. HANYA kembalikan JSON, tidak ada teks di luar JSON
      `;

      const response = await geminiPool.tryAll(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        return ai.models.generateContent({
          model: this.defaultModel,
          contents: {
            parts: [
               { inlineData: { mimeType, data: imageBase64 } },
               { text: prompt }
            ]
          },
          config: {
            systemInstruction: SIJAGA_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                namaLokal: { type: Type.STRING },
                namaIlmiah: { type: Type.STRING },
                namaEn: { type: Type.STRING },
                tingkatKeyakinan: { type: Type.STRING },
                isInvasif: { type: Type.BOOLEAN },
                statusInvasif: { type: Type.STRING },
                alasanInvasif: { type: Type.STRING },
                asalNegara: { type: Type.STRING },
                estimasiUkuran: {
                  type: Type.OBJECT,
                  properties: {
                    panjangCm: { type: Type.NUMBER, nullable: true },
                    beratGram: { type: Type.NUMBER, nullable: true },
                    catatan: { type: Type.STRING }
                  },
                  required: ["catatan"]
                },
                dampakEkologi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                rekomendasiAksi: { type: Type.STRING },
                urgensiLaporan: { type: Type.STRING },
                penjelasanSiJaga: { type: Type.STRING },
                fotoKurangJelas: { type: Type.BOOLEAN },
                panduanFotoUlang: { type: Type.STRING, nullable: true }
              },
              required: [
                "namaLokal", "namaIlmiah", "namaEn", "tingkatKeyakinan", "isInvasif",
                "statusInvasif", "alasanInvasif", "asalNegara", "estimasiUkuran",
                "dampakEkologi", "rekomendasiAksi", "urgensiLaporan", "penjelasanSiJaga",
                "fotoKurangJelas"
              ]
            }
          }
        });
      });

      return this.parseJsonResponse<any>(response.text || "");

    } catch (error: any) {
      // All Gemini keys exhausted — try fallback provider pool
      console.warn("[Gemini] All keys exhausted — trying fallback provider pool...");
      try {
        return await this.identifyFishWithOpenAICompat(imageBase64, mimeType, location, lang);
      } catch (fallbackError) {
        console.error("All providers exhausted:", fallbackError);
      }
      return {
        namaLokal: "Tidak diketahui",
        namaIlmiah: "Unknown",
        namaEn: "Unknown",
        tingkatKeyakinan: "TIDAK YAKIN",
        isInvasif: false,
        statusInvasif: "TIDAK INVASIF",
        alasanInvasif: "Gagal menganalisis gambar.",
        asalNegara: "Tidak diketahui",
        estimasiUkuran: { panjangCm: null, beratGram: null, catatan: "" },
        dampakEkologi: [],
        rekomendasiAksi: "Coba upload ulang. Jika error berlanjut, gunakan fitur Deskripsi Teks.",
        urgensiLaporan: "RENDAH",
        penjelasanSiJaga: "Mohon maaf, layanan AI sedang sibuk. Silakan gunakan fitur Deskripsi Teks untuk mengidentifikasi ikan. 📝",
        fotoKurangJelas: false,
        panduanFotoUlang: null
      };
    }
  }

  // Generic OpenAI-compatible vision handler with per-provider key pool rotation
  private async identifyFishWithOpenAICompat(imageBase64: string, mimeType: string, location: string, lang: string) {
    const speciesList = getSpeciesListForPrompt();
    const prompt = `${SIJAGA_SYSTEM_PROMPT}

Pengguna mengunggah foto ikan untuk diidentifikasi.
Lokasi ditemukan: ${location}
Bahasa respons: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}

SPESIES INVASIF DATABASE:
${speciesList}

TUGASMU: Analisis foto dan kembalikan HANYA JSON valid berikut (tidak ada teks lain):
{
  "namaLokal": "string",
  "namaIlmiah": "string",
  "namaEn": "string",
  "tingkatKeyakinan": "SANGAT YAKIN|CUKUP YAKIN|KURANG YAKIN|TIDAK YAKIN",
  "isInvasif": true|false,
  "statusInvasif": "KRITIS|TINGGI|SEDANG|RENDAH|TIDAK INVASIF|DARURAT",
  "alasanInvasif": "string",
  "asalNegara": "string",
  "estimasiUkuran": { "panjangCm": number|null, "beratGram": number|null, "catatan": "string" },
  "dampakEkologi": ["string"],
  "rekomendasiAksi": "string",
  "urgensiLaporan": "DARURAT|TINGGI|SEDANG|RENDAH",
  "penjelasanSiJaga": "string",
  "fotoKurangJelas": false,
  "panduanFotoUlang": null
}

ATURAN: fotoKurangJelas = true HANYA jika foto benar-benar buram/gelap total. Foto akuarium yang jelas = fotoKurangJelas false.`;

    const content = await fallbackChain.tryChain(async (apiKey, provider) => {
      const res = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(provider.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://sijaga-sungai.app', 'X-Title': 'SiJaga Sungai' } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              { type: 'text', text: prompt },
            ],
          }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });

      if (res.status === 429) throw new Error(`429: rate limited`);
      if (!res.ok) { const t = await res.text(); throw new Error(`${provider.name} ${res.status}: ${t}`); }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Empty response from ${provider.name}`);
      console.log(`[${provider.name}] Fallback identification successful (key ...${apiKey.slice(-6)})`);
      return text;
    });

    return this.parseJsonResponse<any>(content);
  }

  public async identifyFishFromDescription(
    deskripsi: { warna: string; mulut: string; ciriKhas: string; ukuran: string; habitat: string },
    location: string,
    lang: string
  ) {
    try {
      const speciesList = getSpeciesListForPrompt();
      const prompt = `
${SIJAGA_SYSTEM_PROMPT}

Pengguna mendeskripsikan ikan tanpa foto. Lokasi: ${location}
Bahasa respons: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}

Deskripsi:
- Warna tubuh: ${deskripsi.warna}
- Bentuk mulut: ${deskripsi.mulut}
- Ciri khas: ${deskripsi.ciriKhas}
- Ukuran perkiraan: ${deskripsi.ukuran}
- Habitat: ${deskripsi.habitat}

SPESIES INVASIF REFERENSI:
${speciesList}

Kembalikan HANYA valid JSON:
{
  "kandidat": [
    {
      "namaLokal": "string",
      "namaIlmiah": "string",
      "kemungkinanPersen": number,
      "alasan": "string",
      "isInvasif": true|false,
      "statusInvasif": "string"
    }
  ],
  "rekomendasi": "string",
  "saranKonfirmasi": "string (bagaimana konfirmasi dengan foto)"
}
      `;

      const response = await this.callGemini({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: SIJAGA_SYSTEM_PROMPT,
          temperature: 0.2, // Low temperature for more factual matching
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              kandidat: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    namaLokal: { type: Type.STRING },
                    namaIlmiah: { type: Type.STRING },
                    kemungkinanPersen: { type: Type.NUMBER },
                    alasan: { type: Type.STRING },
                    isInvasif: { type: Type.BOOLEAN },
                    statusInvasif: { type: Type.STRING }
                  },
                  required: ["namaLokal", "namaIlmiah", "kemungkinanPersen", "alasan", "isInvasif", "statusInvasif"]
                }
              },
              rekomendasi: { type: Type.STRING },
              saranKonfirmasi: { type: Type.STRING }
            },
            required: ["kandidat", "rekomendasi", "saranKonfirmasi"]
          }
        }
      });

      return this.parseJsonResponse<any>(response.text || "");

    } catch (error) {
      console.error("Error in identifyFishFromDescription:", error);
      return {
        kandidat: [],
        rekomendasi: "Gagal menganalisis deskripsi. Coba identifikasi dengan foto.",
        saranKonfirmasi: "Dapatkan foto ikan agar SiJaga dapat memperkirakan spesies dengan lebih akurat."
      };
    }
  }

  public async calculateEconomy(speciesId: string, quantityKg: number, location: string, lang: string) {
    try {
      const speciesData = SPECIES_DATABASE[speciesId];
      if (!speciesData) throw new Error("Species not found");
      const priceData = JSON.stringify(speciesData.jalurEkonomi, null, 2);

      const prompt = `
${SIJAGA_SYSTEM_PROMPT}

Pengguna menangkap ikan invasif dan ingin tahu nilai ekonominya.
- Spesies: ${speciesData.namaLokal[0]} (${speciesData.namaIlmiah})
- Berat total: ${quantityKg} kg
- Lokasi: ${location}

HARGA REFERENSI DARI DATABASE (gunakan ini sebagai pedoman dasar HARGAPERKG, jangan ubah angkanya secara drastis):
${priceData}

Kembalikan HANYA valid JSON:
{
  "jalurPemanfaatan": [
    {
      "nama": "string (contoh: Pakan Ternak, Tepung Ikan)",
      "tersedia": true|false,
      "prosesSingkat": "string",
      "hargaPerKg": number (Gunakan harga angka saja HANYA dari referensi database),
      "estimasiNilai": number (HARUS TEPAT: hargaPerKg dikali ${quantityKg}),
      "kemudahan": "MUDAH|SEDANG|SULIT",
      "waktuProses": "string"
    }
  ],
  "rekomendasiTerbaik": {
    "jalur": "string",
    "alasan": "string (max 2 kalimat, fokus ke lokasi pengguna)",
    "langkahPertama": "string (satu aksi konkret yang sungguhan bisa dilakukan hari ini)"
  },
  "estimasiBulanan": {
    "asumsiTangkapanKg": number,
    "estimasiPenghasilan": number,
    "catatan": "string (realistis, max Rp 3-4 juta untuk nelayan biasa, jangan clickbait)"
  }
}

ATURAN KETAT UNTUK KALKULASI & OUTPUT:
1. "estimasiNilai" HARUS MATEMATIKA YANG TEPAT: (hargaPerKg * ${quantityKg}). Jangan dibulatkan secara asal.
2. Biasanya hanya tampilkan jalur yang logis dan bisa diakses.
3. JIKA IKAN BERBAHAYA/DILARANG KERAS DIPELIHARA/DIMANFAATKAN (seperti Aligator Gar, Piranha, Arapaima): 
   - WAJIB berikan jalur pemanfaatan DENGAN "tersedia": false.
   - Pada "rekomendasiTerbaik.alasan" dan "estimasiBulanan.catatan", tambahkan PERINTAH TEGAS untuk memusnahkan atau lapor ke Badan Karantina / KKP, bukan malah dijual.
   - "estimasiPenghasilan" untuk ikan dilarang keras = 0.
4. Estimasi penghasilan bulanan harus sangat masuk akal bagi masyarakat awam di daerah tersebut (di bawah UMR atau sedikit tambahan pendapatan).
5. LARANGAN KERAS — KONSUMSI MANUSIA:
   - JANGAN PERNAH merekomendasikan ikan invasif dari sungai/perairan liar untuk dikonsumsi manusia.
   - Ikan invasif dari perairan urban Indonesia berisiko tinggi mengandung logam berat (merkuri, timbal, kadmium) dan patogen berbahaya.
   - Jika ada jalur "Tepung Ikan", "Fillet", "Olahan Pangan", atau sejenisnya: "prosesSingkat" WAJIB menyebut bahwa ini HANYA untuk pakan ternak/hewan, BUKAN untuk manusia.
   - Sertakan kalimat "⚠️ Hanya untuk pakan ternak, bukan konsumsi manusia" di dalam prosesSingkat untuk setiap jalur pengolahan ikan.
`;


      const response = await this.callGemini({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: SIJAGA_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              jalurPemanfaatan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nama: { type: Type.STRING },
                    tersedia: { type: Type.BOOLEAN },
                    prosesSingkat: { type: Type.STRING },
                    hargaPerKg: { type: Type.NUMBER },
                    estimasiNilai: { type: Type.NUMBER },
                    kemudahan: { type: Type.STRING },
                    waktuProses: { type: Type.STRING }
                  },
                  required: ["nama", "tersedia", "prosesSingkat", "hargaPerKg", "estimasiNilai", "kemudahan", "waktuProses"]
                }
              },
              rekomendasiTerbaik: {
                type: Type.OBJECT,
                properties: {
                  jalur: { type: Type.STRING },
                  alasan: { type: Type.STRING },
                  langkahPertama: { type: Type.STRING }
                },
                required: ["jalur", "alasan", "langkahPertama"]
              },
              estimasiBulanan: {
                type: Type.OBJECT,
                properties: {
                  asumsiTangkapanKg: { type: Type.NUMBER },
                  estimasiPenghasilan: { type: Type.NUMBER },
                  catatan: { type: Type.STRING }
                },
                required: ["asumsiTangkapanKg", "estimasiPenghasilan", "catatan"]
              }
            },
            required: ["jalurPemanfaatan", "rekomendasiTerbaik", "estimasiBulanan"]
          }
        }
      });

      return this.parseJsonResponse<any>(response.text || "");

    } catch (error) {
       console.error("Error in calculateEconomy:", error);
       return {
         jalurPemanfaatan: [],
         rekomendasiTerbaik: { jalur: "-", alasan: "Terjadi kesalahan saat menghitung potensi ekonomi. Silakan coba lagi.", langkahPertama: "-" },
         estimasiBulanan: { asumsiTangkapanKg: 0, estimasiPenghasilan: 0, catatan: "Terjadi kesalahan komputasi." }
       };
    }
  }

  public async generateEducationCard(speciesId: string, ageGroup: string, lang: string) {
    try {
      const speciesData = SPECIES_DATABASE[speciesId];
      if (!speciesData) throw new Error("Species not found");

      const prompt = `
${SIJAGA_SYSTEM_PROMPT}

Buat kartu spesies edukatif untuk: ${speciesData.namaLokal[0]} (${speciesData.namaIlmiah})
Target usia: ${ageGroup === 'teen' ? '13-18 tahun (gunakan bahasa casual dan perbandingan relatable)' : '18+ tahun (bisa lebih teknis)'}
Bahasa: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}

Kembalikan HANYA valid JSON:
{
  "namaDisplay": "string",
  "statusBadge": "INVASIF KRITIS|INVASIF TINGGI|INVASIF SEDANG|TIDAK INVASIF",
  "asalUsul": "string (2-3 kalimat gaya bercerita menarik, sesuai usia)",
  "kekuatanSuper": [
    { "nama": "string", "penjelasan": "string (mengapa berbahaya)" }
  ],
  "rantaiDampak": ["A", "B", "C", "D"],
  "faktaMengejutkan": "string",
  "predatorAlami": "string (sebutkan predator alami di habitat ASLI (negara asal) misal 'Di Amazon, dimangsa oleh Arapaima dan buaya'), lalu jelaskan apakah predator tersebut ADA atau TIDAK di perairan Indonesia. Jika tidak ada, jelaskan mengapa ini membuat spesies ini sulit dikendalikan.)",
  "badge": {
    "nama": "string (kreatif, unik per spesies, bukan generic)",
    "deskripsi": "string",
    "emoji": "string"
  },
  "kuis": [
    {
      "soal": "string",
      "opsi": { "A": "string", "B": "string", "C": "string", "D": "string" },
      "jawaban": "A|B|C|D",
      "penjelasan": "string (1-2 kalimat mengapa ini jawabannya)",
      "tingkat": "MUDAH|SEDANG|SULIT"
    }
  ]
}

ATURAN:
- kuis[0].tingkat = MUDAH (logika sangat dasar), kuis[1].tingkat = SEDANG, kuis[2].tingkat = SULIT (butuh logika kritis tentang dampak).
- Jangan buat soal yang butuh hafalan nama ilmiah — fokus ke konsep dan dampak lingkungan.
- rantaiDampak HARUS minimal 4 tahap (A → B → C → D).
- badge.nama HARUS unik untuk karakter/sifat asli spesies ini (contoh: jangan gunakan nama generik).
- asalUsul HARUS bergaya storytelling atau narasi yang seru (jangan kaku seperti buku pelajaran atau ensiklopedia).
- Untuk teen (13-18 tahun): bahasanya kasual, mudah dibayangkan, seperti menjelaskan ke anak usia 14-15 tahun, gunakan perbandingan ringan (misal: "seperti boss di game", dll).
- JIKA bahasa = English, pastikan SELURUH TEKS dan RESPONS JSON dalam bahasa Inggris. Jika bahasa = Bahasa Indonesia, gunakan bahasa Indonesia.
`;

      const response = await this.callGemini({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: SIJAGA_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              namaDisplay: { type: Type.STRING },
              statusBadge: { type: Type.STRING },
              asalUsul: { type: Type.STRING },
              kekuatanSuper: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nama: { type: Type.STRING },
                    penjelasan: { type: Type.STRING }
                  },
                  required: ["nama", "penjelasan"]
                }
              },
              rantaiDampak: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              faktaMengejutkan: { type: Type.STRING },
              predatorAlami: { type: Type.STRING },
              badge: {
                type: Type.OBJECT,
                properties: {
                  nama: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                  emoji: { type: Type.STRING }
                },
                required: ["nama", "deskripsi", "emoji"]
              },
              kuis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    soal: { type: Type.STRING },
                    opsi: {
                      type: Type.OBJECT,
                      properties: {
                        A: { type: Type.STRING },
                        B: { type: Type.STRING },
                        C: { type: Type.STRING },
                        D: { type: Type.STRING }
                      },
                      required: ["A", "B", "C", "D"]
                    },
                    jawaban: { type: Type.STRING },
                    penjelasan: { type: Type.STRING },
                    tingkat: { type: Type.STRING }
                  },
                  required: ["soal", "opsi", "jawaban", "penjelasan", "tingkat"]
                }
              }
            },
            required: ["namaDisplay", "statusBadge", "asalUsul", "kekuatanSuper", "rantaiDampak", "faktaMengejutkan", "predatorAlami", "badge", "kuis"]
          }
        }
      });

      return this.parseJsonResponse<any>(response.text || "");

    } catch (error) {
      console.error("Error in generateEducationCard:", error);
      return {
        namaDisplay: "Ikan Misterius",
        statusBadge: "INVASIF SEDANG",
        asalUsul: "Terjadi kesalahan saat memuat kartu edukasi.",
        kekuatanSuper: [{ nama: "Error", penjelasan: "Gagal memuat data AI." }],
        rantaiDampak: ["A", "B", "C", "D"],
        faktaMengejutkan: "Sistem AI sedang sibuk.",
        badge: { nama: "Perintis", deskripsi: "Gagal memuat", emoji: "😢" },
        kuis: [
          {
            soal: "Apa yang terjadi?",
            opsi: { A: "Error AI", B: "Network", C: "Semua Benar", D: "Salah" },
            jawaban: "C",
            penjelasan: "Kesalahan internal.",
            tingkat: "MUDAH"
          }
        ]
      };
    }
  }

  public async generateReport(speciesName: string, scientificName: string, invasiveStatus: string, locationName: string, quantity: number, waterCondition: string) {
    try {
      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const prompt = `
${SIJAGA_SYSTEM_PROMPT}

Buat laporan temuan resmi berdasarkan data berikut:
- Spesies: ${speciesName} (${scientificName})
- Status invasif: ${invasiveStatus}
- Lokasi: ${locationName}
- Jumlah: ${quantity} ekor
- Kondisi air: ${waterCondition}
- Tanggal: ${new Date().toLocaleDateString('id-ID')}

Kembalikan HANYA valid JSON:
{
  "laporanResmi": {
    "idLaporan": "SR-${dateCode}-${random4}",
    "judul": "string",
    "ringkasan": "string (2 kalimat, informatif)",
    "urgensi": "DARURAT|TINGGI|SEDANG|RENDAH",
    "rekomendasiTindakan": "string"
  },
  "dampakLokal": {
    "prediksi1Tahun": "string (konkret, mudah dibayangkan, bukan jargon ilmiah)",
    "dampakKeNelayan": "string",
    "langkahKomunitas": ["string", "string", "string"],
    "kontakInstansi": ["BRIN: 021-xxxxxxx", "KKP Hotline: 14015"]
  },
  "kontenSosmed": {
    "instagram": "string (max 150 karakter, casual, emoji)",
    "twitter": "string (max 280 karakter, informatif, hashtag)",
    "whatsapp": "string (1 paragraf, personal, ajakan aksi jelas)"
  },
  "hashtags": ["#SiJagaSungai", "#JuaraVibeCoding", "#SpesiesInvasif"]
}

ATURAN KETAT:
1. Jika spesies invasif (seperti Sapu-sapu, Arapaima, dll), berikan urgensi TINGGI atau DARURAT.
2. Jika spesies BUKAN invasif atau TIDAK INVASIF (seperti Nila, Mujair, Mas), BERIKAN urgensi RENDAH dan JANGAN melebih-lebihkan bahaya.
3. Hashtag #SiJagaSungai WAJIB ada di semua versi sosmed dan di array hashtags.
4. Buat 3 versi sosmed dengan tone yang BERBEDA satu sama lain.
`;

      const response = await this.callGemini({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: SIJAGA_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              laporanResmi: {
                type: Type.OBJECT,
                properties: {
                  idLaporan: { type: Type.STRING },
                  judul: { type: Type.STRING },
                  ringkasan: { type: Type.STRING },
                  urgensi: { type: Type.STRING },
                  rekomendasiTindakan: { type: Type.STRING }
                },
                required: ["idLaporan", "judul", "ringkasan", "urgensi", "rekomendasiTindakan"]
              },
              dampakLokal: {
                type: Type.OBJECT,
                properties: {
                  prediksi1Tahun: { type: Type.STRING },
                  dampakKeNelayan: { type: Type.STRING },
                  langkahKomunitas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  kontakInstansi: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["prediksi1Tahun", "dampakKeNelayan", "langkahKomunitas", "kontakInstansi"]
              },
              kontenSosmed: {
                type: Type.OBJECT,
                properties: {
                  instagram: { type: Type.STRING },
                  twitter: { type: Type.STRING },
                  whatsapp: { type: Type.STRING }
                },
                required: ["instagram", "twitter", "whatsapp"]
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["laporanResmi", "dampakLokal", "kontenSosmed", "hashtags"]
          }
        }
      });

      return this.parseJsonResponse<{
        laporanResmi: {
          idLaporan: string;
          judul: string;
          ringkasan: string;
          urgensi: string;
          rekomendasiTindakan: string;
        };
        dampakLokal: {
          prediksi1Tahun: string;
          dampakKeNelayan: string;
          langkahKomunitas: string[];
          kontakInstansi: string[];
        };
        kontenSosmed: {
          instagram: string;
          twitter: string;
          whatsapp: string;
        };
        hashtags: string[];
      }>(response.text || "");

    } catch (error) {
      console.error("Error in generateReport:", error);
      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      return {
        laporanResmi: {
          idLaporan: `SR-${dateCode}-${random4}`,
          judul: "Laporan Temuan Spesies",
          ringkasan: "Sedang terjadi kendala sistem dalam merangkum laporan. Mohon periksa panduan mitigasi lokal.",
          urgensi: "SEDANG",
          rekomendasiTindakan: "Laporkan temuan ini ke dinas perikanan setempat."
        },
        dampakLokal: {
          prediksi1Tahun: "Tidak dapat memprediksi saat ini.",
          dampakKeNelayan: "Menunggu analisis lanjutan.",
          langkahKomunitas: ["Waspadai ekosistem sungai", "Pencegahan penyebaran mandiri"],
          kontakInstansi: ["Dinas Perikanan Setempat", "KKP Hotline: 14015"]
        },
        kontenSosmed: {
          instagram: "Temuan spesies di perairan kita! Mari waspada menjaga ekosistem. #SiJagaSungai",
          twitter: "Temuan spesies di perairan kita! Mari waspada menjaga ekosistem. #SiJagaSungai",
          whatsapp: "Ada temuan spesies yang dilaporkan di komunitas. Ayo jaga sungai dan laporkan di SiJaga Sungai."
        },
        hashtags: ["#SiJagaSungai"]
      };
    }
  }

  public async generateProcessingGuide(speciesId: string, pathway: string, lang: string) {
    try {
      const speciesList = getSpeciesListForPrompt();
      const prompt = `
Generate a step-by-step processing guide for turning invasive species ID: ${speciesId} into ${pathway}.
Requested Language: ${lang}

IMPORTANT RULES:
1. If the pathway is NON-FOOD (like Pakan Ternak, Pupuk, Kerajinan, Ikan Hias, Biochar, etc.), DO NOT provide cooking recipes or instructions to add food seasonings (bumbu).
2. If the pathway is "Ikan Hias" (Ornamental Fish) or similar, the steps must be about catching the fish alive, quarantining, treating with medicine/salt for parasites, and packaging alive for aquarium use. IT IS NOT FOOD. Do not mention cooking, gutting, or eating.
3. If the pathway is "Tepung Ikan" or "Pakan Ternak", the steps involve drying, grinding, and mixing, NOT cooking for human consumption.
4. Keep the steps professional, highly practical, and relevant to the specific pathway.

Species Context:
${speciesList}

Return a JSON object matching this schema:
{
  "title": string,
  "estimated_time": string,
  "difficulty": "MUDAH" | "SEDANG" | "SULIT",
  "tools_needed": string[] (array of tools/ingredients needed),
  "steps": [
    {
      "step_number": number,
      "instruction": string (clear, actionable instruction)
    }
  ],
  "safety_warnings": string[] (array of safety tips, e.g., dealing with sharp fins or toxic parts)
}
      `;

      const response = await this.callGemini({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: SIJAGA_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimated_time: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              tools_needed: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step_number: { type: Type.INTEGER },
                    instruction: { type: Type.STRING }
                  },
                  required: ["step_number", "instruction"]
                }
              },
              safety_warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "estimated_time", "difficulty", "tools_needed", "steps", "safety_warnings"]
          }
        }
      });

      return this.parseJsonResponse<{
        title: string;
        estimated_time: string;
        difficulty: string;
        tools_needed: string[];
        steps: Array<{ step_number: number; instruction: string; }>;
        safety_warnings: string[];
      }>(response.text || "");

    } catch (error) {
      console.error("Error in generateProcessingGuide:", error);
      return {
        title: "Panduan Pengolahan (Gagal Dimuat)",
        estimated_time: "Tidak Diketahui",
        difficulty: "SEDANG",
        tools_needed: ["Pisau", "Wadah"],
        steps: [
          { step_number: 1, instruction: "Pastikan ikan sudah mati sebelum diolah." },
          { step_number: 2, instruction: "Hati-hati dengan duri tajam." }
        ],
        safety_warnings: ["Cuci tangan setelah memegang ikan."]
      };
    }
  }
}

export const geminiService = new GeminiService();
