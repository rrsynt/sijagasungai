import { NextResponse } from 'next/server';
import { saveReport } from '@/lib/firestore';

// Seed data — realistic Indonesian locations, 45 reports covering all major islands
const SEED_REPORTS = [
  // Jawa
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Ciliwung, Jakarta Pusat', latitude: -6.2088, longitude: 106.8456, quantity: 12, waterCondition: 'Keruh', reporterInitial: 'BW' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Kali Bekasi, Jawa Barat', latitude: -6.2383, longitude: 107.0023, quantity: 20, waterCondition: 'Keruh', reporterInitial: 'TH' },
  { speciesName: 'Sapu-sapu Biasa', scientificName: 'Hypostomus plecostomus', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Citarum, Bandung', latitude: -6.8900, longitude: 107.6107, quantity: 35, waterCondition: 'Keruh', reporterInitial: 'DS' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Waduk Saguling, Jawa Barat', latitude: -6.9167, longitude: 107.3833, quantity: 5, waterCondition: 'Jernih', reporterInitial: 'RP' },
  { speciesName: 'Aligator Gar', scientificName: 'Atractosteus spatula', invasiveStatus: 'DARURAT', urgency: 'DARURAT', locationName: 'Sungai Brantas, Surabaya', latitude: -7.2458, longitude: 112.7378, quantity: 1, waterCondition: 'Berlumpur', reporterInitial: 'SH' },
  { speciesName: 'Louhan', scientificName: 'Cichlasoma spp.', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Sungai Bengawan Solo, Solo', latitude: -7.5667, longitude: 110.8229, quantity: 3, waterCondition: 'Berlumpur', reporterInitial: 'AL' },
  { speciesName: 'Koki Liar', scientificName: 'Carassius auratus', invasiveStatus: 'RENDAH', urgency: 'RENDAH', locationName: 'Situ Babakan, Jakarta Selatan', latitude: -6.3575, longitude: 106.8271, quantity: 7, waterCondition: 'Jernih', reporterInitial: 'KS' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Cimanuk, Indramayu', latitude: -6.3299, longitude: 108.3128, quantity: 18, waterCondition: 'Keruh', reporterInitial: 'NW' },
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Waduk Jatiluhur, Purwakarta', latitude: -6.5376, longitude: 107.3990, quantity: 9, waterCondition: 'Jernih', reporterInitial: 'HR' },
  { speciesName: 'Flowerhorn', scientificName: 'Cichlasoma hybrid', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Kali Code, Yogyakarta', latitude: -7.8014, longitude: 110.3653, quantity: 2, waterCondition: 'Jernih', reporterInitial: 'PT' },
  { speciesName: 'Aligator Gar', scientificName: 'Atractosteus spatula', invasiveStatus: 'DARURAT', urgency: 'DARURAT', locationName: 'Sungai Serayu, Banyumas', latitude: -7.4175, longitude: 109.2297, quantity: 1, waterCondition: 'Jernih', reporterInitial: 'BN' },
  // Sumatera
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Toba, Sumatera Utara', latitude: 2.6833, longitude: 98.8667, quantity: 8, waterCondition: 'Jernih', reporterInitial: 'MN' },
  { speciesName: 'Louhan', scientificName: 'Cichlasoma spp.', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Sungai Musi, Palembang', latitude: -2.9761, longitude: 104.7754, quantity: 3, waterCondition: 'Berlumpur', reporterInitial: 'FS' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Deli, Medan', latitude: 3.5893, longitude: 98.6739, quantity: 14, waterCondition: 'Keruh', reporterInitial: 'AR' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Singkarak, Sumatera Barat', latitude: -0.6667, longitude: 100.5667, quantity: 6, waterCondition: 'Jernih', reporterInitial: 'FH' },
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Maninjau, Sumatera Barat', latitude: -0.3167, longitude: 100.1667, quantity: 11, waterCondition: 'Jernih', reporterInitial: 'SY' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Batanghari, Jambi', latitude: -1.6000, longitude: 103.6167, quantity: 22, waterCondition: 'Keruh', reporterInitial: 'WS' },
  { speciesName: 'Aligator Gar', scientificName: 'Atractosteus spatula', invasiveStatus: 'DARURAT', urgency: 'DARURAT', locationName: 'Sungai Siak, Riau', latitude: 0.5167, longitude: 101.4500, quantity: 1, waterCondition: 'Berlumpur', reporterInitial: 'RY' },
  { speciesName: 'Koki Liar', scientificName: 'Carassius auratus', invasiveStatus: 'RENDAH', urgency: 'RENDAH', locationName: 'Danau Ranau, Lampung', latitude: -4.8500, longitude: 103.9333, quantity: 4, waterCondition: 'Jernih', reporterInitial: 'EL' },
  { speciesName: 'Flowerhorn', scientificName: 'Cichlasoma hybrid', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Sungai Rokan, Riau', latitude: 1.2500, longitude: 100.8333, quantity: 2, waterCondition: 'Berlumpur', reporterInitial: 'DH' },
  // Kalimantan
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Sungai Kapuas, Pontianak', latitude: -0.0333, longitude: 109.3328, quantity: 4, waterCondition: 'Jernih', reporterInitial: 'YP' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Mahakam, Samarinda', latitude: -0.5022, longitude: 117.1536, quantity: 16, waterCondition: 'Keruh', reporterInitial: 'IK' },
  { speciesName: 'Louhan', scientificName: 'Cichlasoma spp.', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Danau Sentarum, Kalimantan Barat', latitude: 0.8667, longitude: 111.9667, quantity: 3, waterCondition: 'Berlumpur', reporterInitial: 'GN' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Sungai Barito, Banjarmasin', latitude: -3.3167, longitude: 114.5833, quantity: 7, waterCondition: 'Keruh', reporterInitial: 'MK' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Kahayan, Palangkaraya', latitude: -2.2092, longitude: 113.9167, quantity: 10, waterCondition: 'Keruh', reporterInitial: 'JP' },
  // Sulawesi
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Limboto, Gorontalo', latitude: 0.5833, longitude: 122.6167, quantity: 15, waterCondition: 'Keruh', reporterInitial: 'FM' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Jeneberang, Makassar', latitude: -5.1477, longitude: 119.4328, quantity: 9, waterCondition: 'Keruh', reporterInitial: 'HM' },
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Matano, Sulawesi Selatan', latitude: -2.4667, longitude: 121.3167, quantity: 5, waterCondition: 'Jernih', reporterInitial: 'TR' },
  { speciesName: 'Aligator Gar', scientificName: 'Atractosteus spatula', invasiveStatus: 'DARURAT', urgency: 'DARURAT', locationName: 'Sungai Palu, Sulawesi Tengah', latitude: -0.8917, longitude: 119.8714, quantity: 1, waterCondition: 'Jernih', reporterInitial: 'SM' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Towuti, Sulawesi Selatan', latitude: -2.7500, longitude: 121.5000, quantity: 8, waterCondition: 'Jernih', reporterInitial: 'LS' },
  // Bali & Nusa Tenggara
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Ayung, Bali', latitude: -8.4095, longitude: 115.2580, quantity: 6, waterCondition: 'Jernih', reporterInitial: 'PW' },
  { speciesName: 'Koki Liar', scientificName: 'Carassius auratus', invasiveStatus: 'RENDAH', urgency: 'RENDAH', locationName: 'Danau Batur, Bali', latitude: -8.2500, longitude: 115.3833, quantity: 5, waterCondition: 'Jernih', reporterInitial: 'KD' },
  { speciesName: 'Louhan', scientificName: 'Cichlasoma spp.', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Danau Rinjani, NTB', latitude: -8.4122, longitude: 116.4650, quantity: 2, waterCondition: 'Jernih', reporterInitial: 'ZA' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Noelmina, NTT', latitude: -9.6553, longitude: 124.0011, quantity: 11, waterCondition: 'Keruh', reporterInitial: 'YB' },
  // Maluku & Papua
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Sentani, Papua', latitude: -2.5951, longitude: 140.5177, quantity: 13, waterCondition: 'Jernih', reporterInitial: 'OW' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Memberamo, Papua', latitude: -2.1000, longitude: 138.8333, quantity: 7, waterCondition: 'Keruh', reporterInitial: 'JW' },
  { speciesName: 'Aligator Gar', scientificName: 'Atractosteus spatula', invasiveStatus: 'DARURAT', urgency: 'DARURAT', locationName: 'Sungai Digul, Papua Selatan', latitude: -7.1167, longitude: 139.6000, quantity: 1, waterCondition: 'Berlumpur', reporterInitial: 'AP' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Tes, Bengkulu', latitude: -3.5667, longitude: 102.5167, quantity: 6, waterCondition: 'Jernih', reporterInitial: 'HN' },
  { speciesName: 'Flowerhorn', scientificName: 'Cichlasoma hybrid', invasiveStatus: 'SEDANG', urgency: 'SEDANG', locationName: 'Sungai Wai Seputih, Lampung', latitude: -4.8500, longitude: 105.3000, quantity: 3, waterCondition: 'Berlumpur', reporterInitial: 'SL' },
  // Aceh & ujung barat
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Krueng Aceh, Banda Aceh', latitude: 5.5489, longitude: 95.3231, quantity: 8, waterCondition: 'Keruh', reporterInitial: 'IM' },
  { speciesName: 'Peacock Bass', scientificName: 'Cichla ocellaris', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Laut Tawar, Aceh Tengah', latitude: 4.5800, longitude: 96.9200, quantity: 4, waterCondition: 'Jernih', reporterInitial: 'ZR' },
  { speciesName: 'Red Devil', scientificName: 'Amphilophus labiatus', invasiveStatus: 'TINGGI', urgency: 'TINGGI', locationName: 'Danau Tempe, Sulawesi Selatan', latitude: -4.0000, longitude: 119.9500, quantity: 10, waterCondition: 'Keruh', reporterInitial: 'AJ' },
  { speciesName: 'Sapu-sapu', scientificName: 'Pterygoplichthys pardalis', invasiveStatus: 'KRITIS', urgency: 'TINGGI', locationName: 'Sungai Seputih, Lampung Tengah', latitude: -4.7500, longitude: 105.2000, quantity: 25, waterCondition: 'Keruh', reporterInitial: 'BL' },
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
    // Spread across last 90 days (3 months of realistic activity)
    const reportDate = new Date(now.getTime() - (i * 2.1 + Math.random() * 3) * 24 * 60 * 60 * 1000);
    try {
      const id = await saveReport({ ...report, reportedAt: reportDate });
      results.push({ id, species: report.speciesName });
    } catch (e: any) {
      results.push({ error: e.message, species: report.speciesName });
    }
  }

  return NextResponse.json({ success: true, inserted: results.length, results });
}
