export interface IdentificationResult {
  namaLokal: string;
  namaIlmiah: string;
  namaEn: string;
  tingkatKeyakinan: 'SANGAT YAKIN' | 'CUKUP YAKIN' | 'KURANG YAKIN' | 'TIDAK YAKIN';
  isInvasif: boolean;
  statusInvasif: 'KRITIS' | 'TINGGI' | 'SEDANG' | 'RENDAH' | 'TIDAK INVASIF' | 'DARURAT';
  alasanInvasif: string;
  asalNegara: string;
  estimasiUkuran: { panjangCm: number | null; beratGram: number | null; catatan: string };
  dampakEkologi: string[];
  rekomendasiAksi: string;
  urgensiLaporan: 'DARURAT' | 'TINGGI' | 'SEDANG' | 'RENDAH';
  penjelasanSiJaga: string;
  fotoKurangJelas: boolean;
  panduanFotoUlang: string | null;
}

export interface ReportData {
  id?: string;
  speciesName: string;
  scientificName: string;
  invasiveStatus: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  quantity: number;
  waterCondition: string;
  reporterInitial?: string;
  reportedAt: Date;
  urgency: string;
  imageUrl?: string;
}

export interface EconomyResult {
  jalurPemanfaatan: Array<{
    nama: string;
    tersedia: boolean;
    prosesSingkat: string;
    hargaPerKg: number;
    estimasiNilai: number;
    kemudahan: string;
    waktuProses: string;
  }>;
  rekomendasiTerbaik: {
    jalur: string;
    alasan: string;
    langkahPertama: string;
  };
  estimasiBulanan: {
    asumsiTangkapanKg: number;
    estimasiPenghasilan: number;
    catatan: string;
  };
}

export interface EducationCard {
  namaDisplay: string;
  statusBadge: string;
  asalUsul: string;
  kekuatanSuper: Array<{ nama: string; penjelasan: string }>;
  rantaiDampak: string[];
  faktaMengejutkan: string;
  predatorAlami?: string;
  badge: { nama: string; deskripsi: string; emoji: string };
  kuis: Array<{
    soal: string;
    opsi: { A: string; B: string; C: string; D: string };
    jawaban: string;
    penjelasan: string;
    tingkat: string;
  }>;
}
