# 🐟 SiJaga Sungai

**Platform citizen science berbasis AI untuk identifikasi, pelaporan, dan pemanfaatan spesies ikan invasif di perairan Indonesia.**

> *Satu Foto. Tiga Dampak.* — Identifikasi · Laporkan · Manfaatkan

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://sijaga-sungai-701628588260.asia-southeast1.run.app)
[![#JuaraVibeCoding](https://img.shields.io/badge/%23JuaraVibeCoding-Google-4285F4?style=flat-square&logo=google)](https://rsvp.withgoogle.com/events/juaravibecoding)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%202.0%20Flash-8E75B2?style=flat-square&logo=google)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4?style=flat-square&logo=google-cloud)](https://cloud.google.com/run)
[![PWA](https://img.shields.io/badge/PWA-Installable-5BB974?style=flat-square)](https://web.dev/progressive-web-apps/)

🔗 **Demo:** https://sijaga-sungai-701628588260.asia-southeast1.run.app

---

## Masalah yang Dipecahkan

Indonesia memiliki **150+ sungai** yang terdampak spesies ikan invasif seperti Sapu-sapu (*Pterygoplichthys*), Aligator Gar, Peacock Bass, dan Piranha. Menurut data **KKP**, kerugian ekologi akibat spesies invasif di perairan tawar Indonesia mencapai **miliaran rupiah per tahun** dan terus meningkat.

Mayoritas masyarakat — khususnya nelayan kecil — tidak tahu cara:
1. **Mengidentifikasi** spesies yang ditangkap
2. **Melaporkan** temuan ke pihak berwenang
3. **Memanfaatkan** tangkapan invasif secara ekonomi
4. **Membuang** spesies berbahaya dengan cara yang aman dan legal

**SiJaga Sungai** mengisi keempat celah ini dalam satu platform yang bisa diakses dari HP.

---

## Fitur Lengkap

### 📸 Identifikasi AI — Dua Metode

**Via Foto (Gemini Vision):**
- Upload foto → AI analisis dalam detik
- Status invasif: DARURAT / KRITIS / TINGGI / SEDANG / TIDAK INVASIF
- Nama ilmiah, asal negara, estimasi ukuran, dampak ekologi
- Rekomendasi aksi konkret dari AI (`rekomendasiAksi`)

**Via Deskripsi Teks** *(tanpa foto)*:
- Isi form: warna, bentuk mulut, ciri khas, ukuran, habitat, lokasi
- AI menampilkan kandidat spesies dengan persentase kemungkinan
- Link langsung ke nilai ekonomi / edukasi per kandidat
- Berguna saat ikan sudah lepas atau tidak sempat difoto

### 🗺️ Peta Persebaran Nasional
- Peta interaktif (Google Maps) laporan citizen scientist seluruh Indonesia
- **GPS auto-detect** + reverse geocoding via Nominatim (nama kota otomatis terisi, tanpa API key tambahan)
- Mini bar chart tren laporan 6 bulan terakhir di header peta
- Toggle Heatmap (zona merah) ↔ Titik Laporan
- Data tersimpan di Firebase Firestore untuk riset dan kebijakan

### ⚠️ Panduan Pemanfaatan & Pemusnahan
Setelah identifikasi, app otomatis menampilkan panduan yang sesuai status spesies:
- **Spesies dengan nilai ekonomi** → badge jalur pemanfaatan + link langsung ke kalkulator
- **Spesies DARURAT tanpa nilai ekonomi** (Piranha, Aligator Gar) → 5 langkah pemusnahan layak sesuai **Permen KP No. 19/2020** + tombol **"Lapor ke KKP via WhatsApp"** (0811-1262-220 dengan pesan pra-isi)

### 💰 Kalkulator Nilai Ekonomi + "Jual ke Mana?"
- Hitung potensi penghasilan per kg berdasarkan spesies & lokasi (Gemini AI)
- **Direktori pembeli**: pabrik tepung ikan, peternak lele, pengepul pupuk, komunitas aquascape, restoran, BRIN
- **Panduan proses step-by-step** (accordion):
  - 🌾 Cara membuat tepung ikan skala rumah tangga
  - 🌱 Cara fermentasi Pupuk Cair Organik (POC) dengan EM4
  - 🍽️ Cara mengolah Sapu-sapu untuk konsumsi (termasuk teknik membuka sisik armor)

### 🛡️ Panduan Pencegahan
- 6 tips actionable: jangan lepas ikan hias, sterilisasi peralatan antar perairan, karantina ikan baru
- Tabel spesies yang dilarang (Piranha, Aligator Gar, Arapaima) dengan referensi regulasi
- CTA ke identifikasi dan pelaporan

### 📚 Ensiklopedia + Kuis Gamifikasi
- Kartu edukasi per spesies dihasilkan AI dengan storytelling engaging
- Mini kuis 4 opsi dengan penjelasan jawaban
- Bilingual (Bahasa Indonesia & English)

### 📤 Social Sharing Terintegrasi
- **Setelah identifikasi**: tombol "Bagikan Temuan" → copy teks terformat + hashtag `#SiJagaSungai #JuaraVibeCoding`
- **Setelah laporan**: copy draft sosmed (Instagram / Twitter/X / WhatsApp) per platform dengan satu klik

### 📱 Progressive Web App (PWA)
- Installable di Android/iOS langsung dari browser
- Web manifest + meta tags dikonfigurasi untuk home screen
- Offline support: laporan tersimpan lokal & di-sync otomatis saat kembali online

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router + Server Components) |
| AI | Google Gemini 2.0 Flash (`@google/genai`) |
| Maps | Google Maps Platform (`@react-google-maps/api`) |
| Geocoding | Nominatim OpenStreetMap (reverse geocoding, gratis) |
| Database | Firebase Firestore (Admin SDK) |
| Styling | TailwindCSS 4 |
| Deploy | Google Cloud Run (`asia-southeast1` — Jakarta) |
| Analytics | Google Analytics 4 |

---

## Cara Menjalankan Lokal

**Prerequisites:** Node.js 20+, npm

```bash
# 1. Install dependencies
npm install

# 2. Buat file .env.local dari template
cp .env.example .env.local
# Isi semua variabel (lihat .env.example untuk panduan)

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

**Seed data demo ke Firestore** (opsional, untuk mengisi peta saat demo):
```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"<SEED_SECRET dari .env.local>"}'
```
Memasukkan 10 laporan realistis dari Jakarta, Surabaya, Bandung, Makassar, Gorontalo, Kalimantan, dll.

> ⚠️ `SEED_SECRET` wajib diisi di `.env.local` — endpoint ini diproteksi dan tidak bisa diakses tanpa secret yang benar.

---

## Deploy ke Google Cloud Run

```bash
# Edit PROJECT_ID di deploy.sh terlebih dahulu
chmod +x deploy.sh
./deploy.sh
```

Script otomatis: enable APIs → build & push Docker image → deploy ke Cloud Run Jakarta → output URL.

**Environment variables wajib di Cloud Run:**

| Variable | Sumber |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Service Accounts |
| `APP_URL` | URL Cloud Run setelah first deploy |
| `SEED_SECRET` | String random untuk proteksi endpoint `/api/seed` |

---

## Struktur Proyek

```
app/
├── page.tsx              # Landing page (animated stats, factual data KKP)
├── about/                # Tentang platform & #JuaraVibeCoding
├── identify/             # Tab: Foto AI + Deskripsi Teks
├── map/                  # Peta nasional + mini trend chart
├── economy/              # Kalkulator + Jual ke Mana + Panduan Proses
├── education/            # Ensiklopedia + kuis gamifikasi
├── prevention/           # Panduan pencegahan & tabel regulasi
└── api/
    ├── identify/         # Gemini Vision endpoint
    ├── identify-text/    # Text-based identification
    ├── economy/          # Economic calculation (Gemini)
    ├── report/           # Firestore report submission
    ├── reports/trend/    # Monthly trend data (cached 5m)
    ├── seed/             # Demo data seeding (dilindungi SEED_SECRET)
    └── stats/            # Live report count (cached 1m)

components/
├── identify/
│   ├── PhotoUploader.tsx   # AI photo identification UI
│   ├── IdentifyResult.tsx  # Results + utilization/disposal guidance
│   └── TextIdentifier.tsx  # Text-based identification form
├── map/
│   └── ReportModal.tsx     # Report form dengan GPS support
├── economy/
│   └── EconomyTable.tsx    # Economic pathway results
└── home/                   # Hero, SpeciesSpotlight, RecentReports

lib/
├── gemini.ts               # Gemini AI service layer (key pool + fallback)
├── firestore.ts            # Firebase Admin operations
├── analytics.ts            # GA4 event tracking utility
├── species-database.ts     # 10+ invasive species static data
└── types.ts                # TypeScript interfaces

firestore.rules             # Firestore security rules
```

---

## Alur Pengguna Lengkap

```
Temukan ikan asing
       │
       ├─ Punya foto? → /identify (tab Foto) → Hasil AI
       │                                            │
       └─ Tidak ada foto? → /identify (tab Teks) → Kandidat spesies
                                                          │
                                      ┌────────────────────┤
                                      │                    │
                          Ada nilai ekonomi?           DARURAT?
                                      │                    │
                                 /economy             Panduan buang
                            (Hitung → Jual → Proses)  + WA KKP 0811-1262-220
                                      │
                                   /map (Lapor GPS)
                                      │
                                  Share sosmed 📤
```

---

## Dampak & Skalabilitas

- **Nelayan & Pemancing**: Mengubah "hama" jadi penghasilan — tahu nilainya, cara prosesnya, ke mana menjualnya
- **Pemerintah (KKP/BRIN)**: Data distribusi real-time dari ribuan titik laporan citizen scientist
- **Peneliti**: Peta persebaran spesies invasif yang terus diperbarui komunitas
- **Komunitas & Pelajar**: Edukasi ekologi perairan via gamifikasi dan ensiklopedia interaktif

---

## Dibuat untuk #JuaraVibeCoding

Dibangun sepenuhnya dengan AI-assisted coding sebagai bukti bahwa teknologi dapat mempercepat solusi atas masalah lingkungan nyata.

## Tim

| Nama | Peran |
|---|---|
| **Ratri Risyanto** | Full-Stack Developer |
| **Gemini AI** | AI Engineer (Vision & Text) |
| **AntiGravity** | AI Coding Assistant |
| **Google Cloud** | Infrastructure (Cloud Run + Firebase) |

---

> *"Lindungi sungai kita, satu laporan dalam satu waktu."*

![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
