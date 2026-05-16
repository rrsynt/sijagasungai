import { NextResponse } from 'next/server';
import { saveReport } from '@/lib/firestore';

// Seed data — realistic Indonesian locations
const SEED_REPORTS = [
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Ciliwung, Jakarta', latitude: -6.2088, longitude: 106.8456, quantity: 12, waterCondition: 'Keruh', reporterInitial: 'BW' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Waduk Saguling, Jawa Barat', latitude: -6.9167, longitude: 107.3833, quantity: 5, waterCondition: 'Jernih', reporterInitial: 'RP' },
  { speciesName: 'Aligator Gar', scientificName: 'Atractosteus spatula', invasiveStatus: 'DARURAT', urgency: 'DARURAT', locationName: 'Sungai Brantas, Surabaya', latitude: -7.2458, longitude: 112.7378, quantity: 1, waterCondition: 'Berlumpur', reporterInitial: 'SH' },
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Toba, Sumatera Utara', latitude: 2.6833, longitude: 98.8667, quantity: 8, waterCondition: 'Jernih', reporterInitial: 'MN' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Kali Bekasi, Jawa Barat', latitude: -6.2383, longitude: 107.0023, quantity: 20, waterCondition: 'Keruh', reporterInitial: 'TH' },
  { speciesName: 'Louhan', scientificName: 'Cichlasoma spp.', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Sungai Musi, Palembang', latitude: -2.9761, longitude: 104.7754, quantity: 3, waterCondition: 'Berlumpur', reporterInitial: 'AL' },
  { speciesName: 'Sapu-sapu Biasa', scientificName: 'Hypostomus plecostomus', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Citarum, Bandung', latitude: -6.8900, longitude: 107.6107, quantity: 35, waterCondition: 'Keruh', reporterInitial: 'DS' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Limboto, Gorontalo', latitude: 0.5833, longitude: 122.6167, quantity: 15, waterCondition: 'Keruh', reporterInitial: 'FM' },
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Sungai Kapuas, Kalimantan', latitude: -0.0333, longitude: 109.3328, quantity: 4, waterCondition: 'Jernih', reporterInitial: 'YP' },
  { speciesName: 'Koki Liar', scientificName: 'Carassius auratus', invasiveStatus: 'RENDAH', urgency: 'RENDAH', locationName: 'Situ Babakan, Jakarta Selatan', latitude: -6.3575, longitude: 106.8271, quantity: 7, waterCondition: 'Jernih', reporterInitial: 'KS' },
];

export async function POST(req: Request) {
  // Simple secret check to prevent abuse
  const { secret } = await req.json().catch(() => ({}));
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];
  const now = new Date();

  for (let i = 0; i < SEED_REPORTS.length; i++) {
    const report = SEED_REPORTS[i];
    // Spread across last 30 days
    const reportDate = new Date(now.getTime() - (i * 3 + Math.random() * 2) * 24 * 60 * 60 * 1000);
    try {
      const id = await saveReport({ ...report, reportedAt: reportDate });
      results.push({ id, species: report.speciesName });
    } catch (e: any) {
      results.push({ error: e.message, species: report.speciesName });
    }
  }

  return NextResponse.json({ success: true, inserted: results.length, results });
}
