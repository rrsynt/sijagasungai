'use client';

import { useLanguage } from '@/components/LanguageContext';
import { ShieldAlert, Droplets, Fish, Leaf, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const preventionTips = [
  {
    icon: '🐠',
    titleId: 'Jangan Lepas Ikan Hias ke Alam',
    titleEn: 'Never Release Pet Fish into the Wild',
    descId: 'Mayoritas spesies invasif masuk melalui pelepasan ikan hias yang sudah besar atau tidak diinginkan. Donasikan ke komunitas akuarium, toko ikan, atau Dinas Perikanan setempat.',
    descEn: 'Most invasive species enter through pet fish releases. Donate to aquarium clubs, fish stores, or the local fisheries office.',
    urgent: true,
  },
  {
    icon: '🧽',
    titleId: 'Bersihkan Peralatan Antar Perairan',
    titleEn: 'Clean Equipment Between Water Bodies',
    descId: 'Jaring, perahu, dan boots karet bisa membawa telur atau larva invasif. Keringkan selama 48 jam atau rendam dengan larutan klorin 2% sebelum digunakan di perairan berbeda.',
    descEn: 'Nets, boats, and rubber boots can carry invasive eggs or larvae. Dry for 48 hours or soak in 2% chlorine solution before use in different water bodies.',
    urgent: false,
  },
  {
    icon: '🚫',
    titleId: 'Jangan Pindahkan Ikan Hidup Antar Wilayah',
    titleEn: "Don't Transfer Live Fish Between Regions",
    descId: 'Memindahkan ikan tangkapan hidup ke perairan lain (misalnya untuk spot mancing baru) adalah cara cepat menyebarkan spesies invasif ke wilayah yang belum terdampak.',
    descEn: 'Moving live caught fish to other water bodies (e.g., for new fishing spots) rapidly spreads invasive species to unaffected areas.',
    urgent: true,
  },
  {
    icon: '📦',
    titleId: 'Karantina Ikan Baru Sebelum Masuk Kolam',
    titleEn: 'Quarantine New Fish Before Adding to Ponds',
    descId: 'Ikan baru dari toko atau pameran harus dikarantina minimal 2 minggu di wadah terpisah. Ini mencegah penularan penyakit dan memastikan ikan tidak akan menjadi invasif.',
    descEn: 'New fish from stores or exhibitions should be quarantined at least 2 weeks in a separate container.',
    urgent: false,
  },
  {
    icon: '📢',
    titleId: 'Laporkan Penjual Ikan Ilegal',
    titleEn: 'Report Illegal Fish Sellers',
    descId: 'Jika menemukan penjualan spesies yang dilarang (Piranha, Aligator Gar) di pasar atau online, laporkan ke KKP via hotline 1500-415 atau WhatsApp 0811-1262-220.',
    descEn: 'If you find banned species (Piranha, Alligator Gar) being sold at markets or online, report to KKP via hotline 1500-415.',
    urgent: false,
  },
  {
    icon: '📚',
    titleId: 'Edukasi Komunitas Sekitarmu',
    titleEn: 'Educate Your Community',
    descId: 'Bagikan informasi tentang bahaya spesies invasif kepada nelayan, petani ikan, dan komunitas sekitar sungai. Pengetahuan kolektif adalah pertahanan terbaik.',
    descEn: 'Share information about invasive species dangers with fishermen, fish farmers, and riverside communities. Collective knowledge is the best defense.',
    urgent: false,
  },
];

const bannedSpecies = [
  { name: 'Piranha (Pygocentrus nattereri)', status: 'DILARANG', ref: 'Permen KP No. 19/2020' },
  { name: 'Aligator Gar (Atractosteus spatula)', status: 'DILARANG', ref: 'Permen KP No. 19/2020' },
  { name: 'Arapaima (Arapaima gigas)', status: 'DILARANG', ref: 'Permen KP No. 19/2020' },
  { name: 'Ikan Nila Hitam Invasif', status: 'WASPADA', ref: 'Pemantauan KKP' },
  { name: 'Sapu-sapu (Pterygoplichthys)', status: 'KRITIS', ref: 'Data KKP' },
];

export default function PreventionPageClient() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#fafaf8] py-16 sm:py-24">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 border-b border-gray-200 pb-10">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t('Edukasi Lanjutan', 'Advanced Education')}</p>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          {t('Panduan Pencegahan', 'Prevention Guide')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
          {t(
            'Lebih baik mencegah daripada memberantas. Pelajari cara menghentikan penyebaran spesies invasif sebelum terlambat.',
            'Prevention is better than eradication. Learn how to stop the spread of invasive species before it\'s too late.'
          )}
        </p>
      </section>

      {/* DECISION FLOWCHART SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="border-2 border-gray-900 bg-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-2xl -z-10 opacity-60"></div>
          <h2 className="text-2xl font-black uppercase tracking-wider mb-8 text-center">
            {t('Alur Aksi SiJaga Sungai (Flowchart)', 'SiJaga Sungai Action Flowchart')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 border-2 border-dashed border-gray-300 relative bg-white">
              <div className="w-12 h-12 bg-gray-900 text-white font-black flex items-center justify-center text-lg mb-4 rounded-full">1</div>
              <h3 className="text-lg font-black uppercase tracking-wide mb-2">{t('Pindai Spesies (AI)', 'Scan Species (AI)')}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('Upload foto di menu Identifikasi. AI mendeteksi spesies & status invasif.', 'Upload a photo in the Identify menu. AI detects species & invasive status.')}
              </p>
              {/* Arrow right for md+, down for mobile */}
              <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-gray-400 font-bold text-xl">→</div>
              <div className="block md:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 z-10 text-gray-400 font-bold text-xl">↓</div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 border-2 border-dashed border-gray-300 relative bg-white">
              <div className="w-12 h-12 bg-gray-900 text-white font-black flex items-center justify-center text-lg mb-4 rounded-full">2</div>
              <h3 className="text-lg font-black uppercase tracking-wide mb-2">{t('Ambil Tindakan', 'Take Action')}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('Jika Invasif: JANGAN dilepas. Jika Aman: Boleh dilepas / konsumsi.', 'If Invasive: DO NOT release. If Safe: Can be released or consumed.')}
              </p>
              {/* Arrow right for md+, down for mobile */}
              <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-gray-400 font-bold text-xl">→</div>
              <div className="block md:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 z-10 text-gray-400 font-bold text-xl">↓</div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 border-2 border-dashed border-gray-300 bg-white">
              <div className="w-12 h-12 bg-gray-900 text-white font-black flex items-center justify-center text-lg mb-4 rounded-full">3</div>
              <h3 className="text-lg font-black uppercase tracking-wide mb-2">{t('Petakan Tangkapan', 'Map the Catch')}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('Kirim laporan ke peta nasional untuk melacak dampak ekologi.', 'Submit the report to the national map to track ecological impacts.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Column - Actions */}
        <div className="lg:col-span-7">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">{t('Hal yang Bisa Kamu Lakukan', 'What You Can Do')}</h2>
          
          <div className="space-y-10">
            {preventionTips.map((tip, i) => (
              <div key={i} className="group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tip.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-sunai transition-colors">
                    {t(tip.titleId, tip.titleEn)}
                  </h3>
                  {tip.urgent && (
                    <span className="text-[10px] font-black tracking-widest bg-red-100 text-red-700 px-2 py-1 uppercase ml-2">
                      {t('Penting', 'Important')}
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-700 leading-relaxed pl-11">{t(tip.descId, tip.descEn)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Legal & Health */}
        <div className="lg:col-span-5 space-y-16">
          
          {/* Spesies dilarang */}
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-6 border-b border-gray-200 pb-2">{t('Spesies Diawasi & Dilarang', 'Monitored & Banned Species')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b-2 border-gray-900">
                  <tr>
                    <th className="py-2 font-bold text-gray-900">{t('Spesies', 'Species')}</th>
                    <th className="py-2 font-bold text-gray-900">{t('Status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bannedSpecies.map((sp) => (
                    <tr key={sp.name}>
                      <td className="py-3 font-medium text-gray-800">{sp.name}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest ${sp.status === 'DILARANG' ? 'bg-red-100 text-red-800 border border-red-200' : sp.status === 'KRITIS' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                          {sp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">* {t('Sesuai Permen KP No. 19/2020', 'Per KKP Regulation No. 19/2020')}</p>
          </div>

          {/* Health warning */}
          <div className="border-l-4 border-red-600 pl-6 py-2">
            <h2 className="text-xl font-extrabold text-red-700 mb-3 uppercase tracking-widest">
              {t('Peringatan Kesehatan', 'Health Warning')}
            </h2>
            <p className="text-sm font-bold text-gray-900 mb-4">
              {t('Jangan konsumsi ikan dasar sungai kota (Sapu-sapu, dll) secara langsung.', 'Do not consume urban river bottom feeders (Suckermouth, etc) directly.')}
            </p>
            <ul className="text-sm text-gray-700 space-y-2 mb-4 list-disc list-inside">
              <li>{t('Kontaminasi Bakteri E. coli & Coliform', 'E. coli & Coliform Bacteria Contamination')}</li>
              <li>{t('Logam Berat (Pb, Cd, Hg, Cu, Cr)', 'Heavy Metals (Pb, Cd, Hg, Cu, Cr)')}</li>
              <li>{t('Parasit Internal & Eksternal', 'Internal & External Parasites')}</li>
            </ul>
            <p className="text-xs font-bold text-red-600 bg-red-50 p-3">
              {t('TIDAK ADA cara memasak yang bisa menghilangkan logam berat dari jaringan ikan.', 'NO cooking method can remove heavy metals from fish tissue.')}
            </p>
          </div>
        </div>
      </div>

      {/* PANDUAN PEMUSNAHAN */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 border-t border-gray-200 pt-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">{t('Prosedur Pemusnahan Resmi', 'Official Disposal Procedure')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
          {[
            {
              n: '01',
              id: 'Jangan Lepas Kembali',
              en: 'Do Not Release',
              descId: 'Melanggar Pasal 7 Permen KP No. 19/2020, dapat dikenai sanksi pidana.',
              descEn: 'Violates Article 7 KKP Regulation No. 19/2020, subject to criminal penalties.',
            },
            {
              n: '02',
              id: 'Matikan Manusiawi',
              en: 'Humane Euthanasia',
              descId: 'Masukkan ikan ke wadah berisi es batu atau tempatkan di freezer selama 30-60 menit hingga tidak bergerak.',
              descEn: 'Place fish in an ice bath or freezer for 30-60 minutes until motionless.',
            },
            {
              n: '03',
              id: 'Dokumentasikan',
              en: 'Document',
              descId: 'Foto ikan dari berbagai sudut, catat GPS lokasi tangkap, tanggal, dan jumlah untuk riset BRIN.',
              descEn: 'Photograph from multiple angles, record GPS location, date, and quantity for BRIN research.',
            },
            {
              n: '04',
              id: 'Manfaatkan (Non-pangan)',
              en: 'Utilize (Non-food)',
              descId: 'Olah menjadi tepung ikan (pakan ternak) atau pupuk organik (POC).',
              descEn: 'Process into fish meal (animal feed) or organic fertilizer (LOF).',
            },
            {
              n: '05',
              id: 'Laporkan KKP',
              en: 'Report to KKP',
              descId: 'Hubungi Hotline 1500-415 dalam 1×24 jam beserta dokumentasi.',
              descEn: 'Contact Hotline 1500-415 within 24 hours with documentation.',
            },
            {
              n: '06',
              id: 'Simpan Spesimen',
              en: 'Store Specimen',
              descId: 'Untuk spesies Darurat (Piranha, Arapaima), simpan spesimen di freezer dan hubungi universitas terdekat.',
              descEn: 'For Emergency species, store in freezer and contact nearest university.',
            },
          ].map((step) => (
            <div key={step.n} className="flex flex-col border-t border-gray-200 pt-4">
              <span className="text-sm font-black text-primary-sunai mb-2">{step.n}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t(step.id, step.en)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(step.descId, step.descEn)}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={`https://wa.me/628111262220?text=${encodeURIComponent('Halo KKP, saya menemukan spesies invasif dan membutuhkan panduan pemusnahan yang layak. #SiJagaSungai')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            💬 {t('Hubungi KKP via WhatsApp', 'Contact KKP via WhatsApp')}
          </a>
          <a
            href="tel:1500415"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            📞 {t('Telepon Call Center KKP (1500-415)', 'Call KKP Call Center (1500-415)')}
          </a>
        </div>
      </section>

    </div>
  );
}
