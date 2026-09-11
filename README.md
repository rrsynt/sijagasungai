# 🐟 SiJaga Sungai

**An AI-powered citizen-science platform for identifying, reporting and making use of invasive fish species in Indonesian freshwaters.**

> *One photo. Three outcomes.* — Identify · Report · Make it count

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://sijaga-sungai-701628588260.asia-southeast1.run.app)
[![#JuaraVibeCoding](https://img.shields.io/badge/%23JuaraVibeCoding-Google-4285F4?style=flat-square&logo=google)](https://rsvp.withgoogle.com/events/juaravibecoding)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%202.0%20Flash-8E75B2?style=flat-square&logo=google)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4?style=flat-square&logo=google-cloud)](https://cloud.google.com/run)
[![PWA](https://img.shields.io/badge/PWA-Installable-5BB974?style=flat-square)](https://web.dev/progressive-web-apps/)

🔗 **Live demo:** https://sijaga-sungai-701628588260.asia-southeast1.run.app

> 🇮🇩 Versi Bahasa Indonesia: [README.id.md](README.id.md)

---

<!--
## Screenshots

Capture these from the live demo (mobile view looks best — this is a PWA),
save them into docs/screenshots/, then remove the comment markers.

| AI identification | Distribution map |
|---|---|
| ![AI identification](docs/screenshots/01-identify.png) | ![Distribution map](docs/screenshots/02-map.png) |

| Home | Economic use |
|---|---|
| ![Home](docs/screenshots/03-home.png) | ![Economic use](docs/screenshots/04-economy.png) |
-->

---

## The problem

Indonesia has **150+ rivers** affected by invasive fish species such as the sailfin catfish (*Pterygoplichthys*), alligator gar, peacock bass and piranha. According to **KKP** (the Ministry of Marine Affairs and Fisheries), the ecological damage caused by invasive species in Indonesian freshwaters runs into **billions of rupiah per year** and keeps rising.

Most people — small-scale fishers in particular — do not know how to:

1. **Identify** what they have caught
2. **Report** the finding to the authorities
3. **Sell or process** an invasive catch
4. **Dispose** of dangerous species safely and legally

**SiJaga Sungai** addresses all four gaps in a single platform that runs on a phone.

---

## Features

### 📸 AI identification — two methods

**From a photo (Gemini Vision):**
- Upload a photo → AI analysis within seconds
- Invasiveness status: CRITICAL / SEVERE / HIGH / MODERATE / NOT INVASIVE
- Scientific name, country of origin, estimated size, ecological impact
- Concrete recommended actions from the model

**From a text description** *(no photo needed)*:
- Fill in a form: colour, mouth shape, distinguishing features, size, habitat, location
- AI returns candidate species ranked by likelihood
- Each candidate links straight to its economic value and educational card
- Useful when the fish escaped, or when there was no time to photograph it

### 🗺️ National distribution map
- Interactive Google Maps view of citizen-scientist reports across Indonesia
- **GPS auto-detect** with reverse geocoding via Nominatim (place names filled in automatically, no extra API key)
- Mini bar chart of the last 6 months of reporting activity in the map header
- Toggle between heatmap zones and individual report pins
- Data stored in Firebase Firestore for research and policy use

### ⚠️ Handling and disposal guidance
After identification, the app shows guidance matched to the species' status:
- **Species with economic value** → utilisation pathway badge and a direct link to the calculator
- **CRITICAL species with no economic value** (piranha, alligator gar) → a 5-step lawful disposal procedure per **Permen KP No. 19/2020**, plus a **"Report to KKP via WhatsApp"** button with a pre-filled message

### 💰 Economic value calculator + "where to sell"
- Estimates potential income per kilogram by species and location (Gemini)
- **Buyer directory**: fishmeal plants, catfish farms, fertiliser collectors, aquascaping communities, restaurants, BRIN
- **Step-by-step processing guides** in accordions:
  - 🌾 Making fishmeal at household scale
  - 🌱 Fermenting organic liquid fertiliser (POC) with EM4
  - 🍽️ Preparing sailfin catfish for consumption, including how to open the armoured scales

### 🛡️ Prevention guidance
- Six actionable tips: never release ornamental fish, sterilise equipment between water bodies, quarantine new fish
- Table of prohibited species (piranha, alligator gar, arapaima) with regulatory references
- Calls to action into identification and reporting

### 📚 Encyclopaedia + gamified quiz
- AI-generated educational cards per species, written as engaging short-form storytelling
- Four-option mini quizzes with explained answers
- Bilingual (Bahasa Indonesia and English)

### 📤 Built-in social sharing
- **After identification**: "Share this finding" produces formatted text with the `#SiJagaSungai #JuaraVibeCoding` hashtags
- **After reporting**: one-click copy of a ready-to-post draft for Instagram, X/Twitter or WhatsApp

### 📱 Progressive Web App
- Installable on Android and iOS straight from the browser
- Web manifest and meta tags configured for the home screen
- Offline support: reports are queued locally and synced automatically when the connection returns

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router + Server Components) |
| AI | Google Gemini 2.0 Flash (`@google/genai`) |
| Maps | Google Maps Platform (`@react-google-maps/api`) |
| Geocoding | Nominatim / OpenStreetMap (reverse geocoding, free) |
| Database | Firebase Firestore (Admin SDK) |
| Styling | TailwindCSS 4 |
| Deploy | Google Cloud Run (`asia-southeast1` — Jakarta) |
| Analytics | Google Analytics 4 |

---

## Running locally

**Prerequisites:** Node.js 20+, npm

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local from the template
cp .env.example .env.local
# Fill in every variable (see .env.example for guidance)

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Seeding demo data into Firestore** (optional — useful to populate the map for a demo):

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"<SEED_SECRET from .env.local>"}'
```

This inserts ten realistic reports from Jakarta, Surabaya, Bandung, Makassar, Gorontalo, Kalimantan and elsewhere.

> ⚠️ `SEED_SECRET` must be set in `.env.local`. The endpoint is protected and returns nothing without the correct secret.

---

## Deploying to Google Cloud Run

```bash
# Set PROJECT_ID in deploy.sh first
chmod +x deploy.sh
./deploy.sh
```

The script enables the required APIs, builds and pushes the Docker image, deploys to Cloud Run in Jakarta, and prints the resulting URL.

**Environment variables required on Cloud Run:**

| Variable | Source |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Service Accounts |
| `APP_URL` | The Cloud Run URL after the first deploy |
| `SEED_SECRET` | Any random string, to protect the `/api/seed` endpoint |

---

## Project structure

```
app/
├── page.tsx              # Landing page (animated stats, factual KKP data)
├── about/                # About the platform & #JuaraVibeCoding
├── identify/             # Tabs: AI photo + text description
├── map/                  # National map + mini trend chart
├── economy/              # Calculator + where to sell + processing guides
├── education/            # Encyclopaedia + gamified quiz
├── prevention/           # Prevention guidance & regulation table
└── api/
    ├── identify/         # Gemini Vision endpoint
    ├── identify-text/    # Text-based identification
    ├── economy/          # Economic calculation (Gemini)
    ├── report/           # Firestore report submission
    ├── reports/trend/    # Monthly trend data (cached 5m)
    ├── seed/             # Demo data seeding (protected by SEED_SECRET)
    └── stats/            # Live report count (cached 1m)

components/
├── identify/
│   ├── PhotoUploader.tsx   # AI photo identification UI
│   ├── IdentifyResult.tsx  # Results + utilisation/disposal guidance
│   └── TextIdentifier.tsx  # Text-based identification form
├── map/
│   └── ReportModal.tsx     # Report form with GPS support
├── economy/
│   └── EconomyTable.tsx    # Economic pathway results
└── home/                   # Hero, SpeciesSpotlight, RecentReports

lib/
├── gemini.ts               # Gemini service layer (key pool + fallback)
├── firestore.ts            # Firebase Admin operations
├── analytics.ts            # GA4 event tracking utility
├── species-database.ts     # Static data for 10+ invasive species
└── types.ts                # TypeScript interfaces

firestore.rules             # Firestore security rules
```

---

## End-to-end user flow

```
Spot an unfamiliar fish
       │
       ├─ Have a photo? → /identify (Photo tab) → AI result
       │                                            │
       └─ No photo? → /identify (Text tab) → Ranked candidates
                                                          │
                                      ┌────────────────────┤
                                      │                    │
                          Has economic value?         CRITICAL?
                                      │                    │
                                 /economy             Disposal guide
                            (Value → Sell → Process)  + WhatsApp KKP
                                      │
                                   /map (report with GPS)
                                      │
                                  Share to social 📤
```

---

## Impact and scalability

- **Fishers and anglers** — turn a nuisance species into income: know what it is worth, how to process it, and who buys it
- **Government (KKP / BRIN)** — real-time distribution data from thousands of citizen-science reports
- **Researchers** — an invasive-species distribution map that the community keeps updating
- **Communities and students** — freshwater ecology education through gamification and interactive reference material

---

## Built for #JuaraVibeCoding

Built entirely with AI-assisted coding, as a demonstration that the technology can accelerate real solutions to real environmental problems.

## Team

| Name | Role |
|---|---|
| **Ratri Risyanto** | Full-Stack Developer |
| **Gemini AI** | AI Engineer (Vision & Text) |
| **AntiGravity** | AI Coding Assistant |
| **Google Cloud** | Infrastructure (Cloud Run + Firebase) |

---

> *"Protect our rivers, one report at a time."*

![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
