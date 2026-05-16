export interface EconomicPathway {
  available: boolean;
  pricePerKg: number;
  process: string;
  difficulty: 'MUDAH' | 'SEDANG' | 'SULIT';
  timeRequired: string;
}

export interface InvasiveSpecies {
  id: string;
  namaLokal: string[];          // semua nama lokal yang dikenal
  namaIlmiah: string;
  namaEn: string;
  asal: string;
  statusInvasif: 'KRITIS' | 'TINGGI' | 'SEDANG' | 'RENDAH' | 'DARURAT';
  ekosistemTerdampak: string[];
  ciriIdentifikasi: string[];
  dampakEkologi: string[];
  jalurEkonomi: {
    tepungIkan?: EconomicPathway;
    pakanSegar?: EconomicPathway;
    pupukOrganik?: EconomicPathway;
    konsumsi?: EconomicPathway;
    ikanhias?: EconomicPathway;
    kerajinan?: EconomicPathway;
  };
  urgensiLaporan: 'DARURAT' | 'TINGGI' | 'SEDANG' | 'RENDAH';
  referensi: string;
  badgeName: string;
  badgeEmoji: string;
  imageUrl?: string;
  funFact: string;
}

export const SPECIES_DATABASE: Record<string, InvasiveSpecies> = {
  "pterygoplichthys": {
    id: "pterygoplichthys",
    namaLokal: ["Sapu-sapu", "Ikan Bandar", "Ikan Kaca Kaca"],
    namaIlmiah: "Pterygoplichthys pardalis",
    namaEn: "Amazon Sailfin Catfish",
    asal: "Amerika Selatan",
    statusInvasif: "KRITIS",
    ekosistemTerdampak: ["Sungai", "Danau", "Waduk", "Perairan Dangkal"],
    ciriIdentifikasi: ["Tubuh tertutup lempeng tulang", "Mulut di bawah berbentuk mangkuk penghisap", "Sirip punggung besar seperti layar"],
    dampakEkologi: ["Merusak habitat bertelur ikan lokal", "Meningkatkan kekeruhan air", "Bersaing makanan dengan ikan endemik"],
    jalurEkonomi: {
      tepungIkan: { available: true, pricePerKg: 8000, process: "Pengeringan dan penggilingan fillet/sisa pemotongan", difficulty: 'SEDANG', timeRequired: "2-3 hari" },
      pakanSegar: { available: true, pricePerKg: 3000, process: "Pencacahan mentah untuk pakan lele/unggas", difficulty: 'MUDAH', timeRequired: "Langsung" },
      pupukOrganik: { available: true, pricePerKg: 2000, process: "Fermentasi dengan EM4", difficulty: 'MUDAH', timeRequired: "14 hari" },
      kerajinan: { available: true, pricePerKg: 15000, process: "Penyamakan kulit untuk dompet/ikat pinggang", difficulty: 'SULIT', timeRequired: "7-10 hari" }
    },
    urgensiLaporan: "TINGGI",
    referensi: "Kementerian Kelautan dan Perikanan (KKP)",
    badgeName: "Sapubersih",
    badgeEmoji: "🧹",
    imageUrl: "/images/species/sapu_sapu.png",
    funFact: "Betina bisa menghasilkan hingga 300 telur per musim dan pejantan sangat agresif menjaga sarangnya."
  },
  "red-devil": {
    id: "red-devil",
    namaLokal: ["Red Devil", "Ikan Setan Merah", "Oscar Merah", "Ikan Nila Merah Palsu"],
    namaIlmiah: "Amphilophus labiatus",
    namaEn: "Red Devil Cichlid",
    asal: "Amerika Tengah",
    statusInvasif: "TINGGI",
    ekosistemTerdampak: ["Danau vulkanik", "Waduk", "Sungai aliran lambat"],
    ciriIdentifikasi: ["Warna dominan merah atau oranye terang", "Bibir tebal", "Bentuk tubuh oval membulat", "Pejantan memiliki tonjolan di kepala (nuchal hump)"],
    dampakEkologi: ["Predator agresif bagi larva dan telur ikan endemik", "Kepadatan populasi menyingkirkan spesies asli"],
    jalurEkonomi: {
      konsumsi: { available: true, pricePerKg: 18000, process: "Diolah menjadi krispi, keripik, atau abon", difficulty: 'SEDANG', timeRequired: "Sesuai resep" },
      ikanhias: { available: true, pricePerKg: 25000, process: "Karantina dan penyembuhan luka tangkap", difficulty: 'MUDAH', timeRequired: "3-5 hari" }
    },
    urgensiLaporan: "TINGGI",
    referensi: "Kementerian Kelautan dan Perikanan (KKP)",
    badgeName: "SetanMerah",
    badgeEmoji: "👹",
    imageUrl: "/images/species/red_devil.png",
    funFact: "Punya rahang sangat kuat yang berevolusi untuk menghancurkan cangkang siput air di habitat aslinya."
  },
  "flowerhorn": {
    id: "flowerhorn",
    namaLokal: ["Louhan", "Ikan Jenong"],
    namaIlmiah: "Cichlasoma spp. (hybrid)",
    namaEn: "Flowerhorn Cichlid",
    asal: "Hasil Persilangan (Hybrid)",
    statusInvasif: "SEDANG",
    ekosistemTerdampak: ["Sungai perkotaan", "Saluran air", "Danau"],
    ciriIdentifikasi: ["Tonjolan sangat besar di dahi", "Corak hitam pekat di sisi tubuh (marking)", "Warna cerah mencolok, perpaduan merah dan biru/hijau"],
    dampakEkologi: ["Karnivora oportunistik", "Memperebutkan wilayah teritori dengan ikan asli (sangat teritorial)"],
    jalurEkonomi: {
      ikanhias: { available: true, pricePerKg: 50000, process: "Sortir berdasarkan kualitas jenong dan warna", difficulty: 'SEDANG', timeRequired: "Beberapa minggu" },
      konsumsi: { available: true, pricePerKg: 15000, process: "Digoreng kering (meskipun kepala besar dan banyak duri)", difficulty: 'MUDAH', timeRequired: "Langsung" }
    },
    urgensiLaporan: "SEDANG",
    referensi: "Citizen Science & Komunitas Akuarium",
    badgeName: "SiJenong",
    badgeEmoji: "🧠",
    imageUrl: "/images/species/flowerhorn.png",
    funFact: "Bentuk jenong di kepalanya sebenarnya adalah timbunan lemak dan cairan jeli, bukan rangka tengkorak keras."
  },
  "aligator-gar": {
    id: "aligator-gar",
    namaLokal: ["Ikan Buaya", "Aligator Gar", "Spatula"],
    namaIlmiah: "Atractosteus spatula",
    namaEn: "Alligator Gar",
    asal: "Amerika Utara",
    statusInvasif: "DARURAT",
    ekosistemTerdampak: ["Sungai besar", "Terusan", "Danau"],
    ciriIdentifikasi: ["Moncong panjang mirip buaya dengan gigi tajam", "Sisik berbentuk wajik, tebal bak zirah", "Bentuk tubuh memanjang silindris"],
    dampakEkologi: ["Predator puncak yang menelan ikan utuh-utuh", "Kapasitas menyapu bersih ikan bernilai komersial milik nelayan"],
    jalurEkonomi: {}, 
    urgensiLaporan: "DARURAT",
    referensi: "Permen KP No. 19/2020",
    badgeName: "PredatorPuncak",
    badgeEmoji: "🐊",
    imageUrl: "/images/species/alligator_gar.png",
    funFact: "Telur Aligator Gar sangat beracun bagi mamalia, burung, dan manusia jika tidak sengaja terkonsumsi."
  },
  "piranha": {
    id: "piranha",
    namaLokal: ["Piranha", "Bawal Merah (sering dikelirukan)"],
    namaIlmiah: "Pygocentrus nattereri",
    namaEn: "Red-bellied Piranha",
    asal: "Amerika Selatan (Amazon)",
    statusInvasif: "DARURAT",
    ekosistemTerdampak: ["Sungai air tawar payau"],
    ciriIdentifikasi: ["Gigi segitiga tajam menyerupai gergaji rapat", "Bagian bawah perut berwarna kemerahan hingga jingga terang", "Berbadan pipih bulat"],
    dampakEkologi: ["Sangat berbahaya bagi ikan asli, hewan liar, dan potensial melukai manusia", "Sering berburu dalam kawanan besar yang agresif"],
    jalurEkonomi: {},
    urgensiLaporan: "DARURAT",
    referensi: "Permen KP No. 19/2020",
    badgeName: "GigiGergaji",
    badgeEmoji: "🐟",
    imageUrl: "/images/species/piranha.png",
    funFact: "Tekanan gigitan piranha bisa dibilang salah satu yang terkuat dibandingkan ukuran tubuhnya pada vertebrata mana pun."
  },
  "suckermouth": {
    id: "suckermouth",
    namaLokal: ["Sapu-sapu Biasa", "Pleco", "Ikan Sapu-Sapu Kecil"],
    namaIlmiah: "Hypostomus plecostomus",
    namaEn: "Suckermouth Catfish",
    asal: "Amerika Selatan",
    statusInvasif: "KRITIS",
    ekosistemTerdampak: ["Seluruh perairan tawar", "Saluran limbah", "Sungai kotor perkotaan"],
    ciriIdentifikasi: ["Warna dominan gelap/hitam dengan bintik pudar", "Kulit kasar berduri rapat", "Bisa bertahan hidup di air sangat rendah oksigen"],
    dampakEkologi: ["Merusak dinding dan sedimen tepi sungai karena bersarang dalam lubang di tebing basah", "Memakan lumut sekaligus telur ikan lain yang menempel"],
    jalurEkonomi: {
      tepungIkan: { available: true, pricePerKg: 8000, process: "Pengeringan menyeluruh, digiling kasar", difficulty: 'SEDANG', timeRequired: "2-3 hari" },
      pakanSegar: { available: true, pricePerKg: 3000, process: "Pencacahan mentah", difficulty: 'MUDAH', timeRequired: "Langsung" },
      pupukOrganik: { available: true, pricePerKg: 2000, process: "Fermentasi mikroba", difficulty: 'MUDAH', timeRequired: "14 hari" },
      kerajinan: { available: true, pricePerKg: 15000, process: "Kulit dikerok dan diamplas menjadi kulit samak kaku", difficulty: 'SULIT', timeRequired: "7 hari" }
    },
    urgensiLaporan: "TINGGI",
    referensi: "Kementerian Kelautan dan Perikanan (KKP)",
    badgeName: "PenyedotSungai",
    badgeEmoji: "🕳️",
    imageUrl: "/images/species/suckermouth.png",
    funFact: "Memiliki adaptasi usus khusus layaknya paru-paru yang memungkinkan mereka menghirup udara langsung dari permukaan pada air yang polutif."
  },
  "blackchin-tilapia": {
    id: "blackchin-tilapia",
    namaLokal: ["Tilapia Dagu Hitam", "Nila Hitam Invasif"],
    namaIlmiah: "Sarotherodon melanotheron",
    namaEn: "Blackchin Tilapia",
    asal: "Afrika Barat",
    statusInvasif: "SEDANG",
    ekosistemTerdampak: ["Estuari", "Muara", "Mangrove", "Tambak udang/bandeng"],
    ciriIdentifikasi: ["Bercak kehitaman mencolok di bagian dagu, pangkal tenggorokan dan tutup insang (operkulum)", "Badan sedikit lebih pipih dan sirip lebih kuning dibanding tilapia biasa"],
    dampakEkologi: ["Sangat toleran salinitas tinggi, mendominasi muara", "Menjadi hama tambak karena rakus memakan pakan udang nelayan"],
    jalurEkonomi: {
      konsumsi: { available: true, pricePerKg: 14000, process: "Pembersihan empedu agar tidak terasa pahit, lalu digoreng atau dipalek/pepes", difficulty: 'SEDANG', timeRequired: "Langsung" }
    },
    urgensiLaporan: "SEDANG",
    referensi: "Studi Ekologi Estuari & Tambak Indonesia",
    badgeName: "SiDaguHitam",
    badgeEmoji: "🗿",
    imageUrl: "/images/species/blackchin_tilapia.png",
    funFact: "Jantannya menyimpan dan mengerami ratusan telur di dalam mulutnya (paternal mouthbrooder) selama berminggu-minggu tanpa makan."
  },
  "goldfish-liar": {
    id: "goldfish-liar",
    namaLokal: ["Koki Liar", "Goldfish Liar", "Ikan Koki Buangan"],
    namaIlmiah: "Carassius auratus",
    namaEn: "Feral Goldfish",
    asal: "Asia Timur",
    statusInvasif: "RENDAH",
    ekosistemTerdampak: ["Danau tenang", "Sungai pegunungan bersuhu sejuk", "Kolam alami"],
    ciriIdentifikasi: ["Warna kembali menjadi hijau zaitun, pudar, atau jingga kotor di alam liar", "Bentuk badan memanjang tidak sebulat di akuarium", "Mencapai ukuran gigantik melebihi piring"],
    dampakEkologi: ["Mencabut tumbuhan air hingga ke akar saat mencari makan di lumpur dasar (benthic feeder), menyebabkan ledakan alga karena air keruh"],
    jalurEkonomi: {
      ikanhias: { available: true, pricePerKg: 10000, process: "Budidaya pembesaran lanjutan penghobi kolam", difficulty: 'MUDAH', timeRequired: "Mingguan" },
      konsumsi: { available: true, pricePerKg: 10000, process: "Goreng garing (daging cenderung lembek dan memiliki banyak duri halus tipe Y)", difficulty: 'MUDAH', timeRequired: "Langsung" }
    },
    urgensiLaporan: "RENDAH",
    referensi: "Pemantauan Spesies Asing Kolam Air Tawar",
    badgeName: "MonsterEmas",
    badgeEmoji: "🐡",
    imageUrl: "/images/species/feral_goldfish.png",
    funFact: "Ikan koki hias yang dilepaskan dapat membesar hingga 10 kali ukuran akuariumnya dan menghancurkan ekosistem flora air halus di danau."
  },
  "peacock-bass": {
    id: "peacock-bass",
    namaLokal: ["Peacock Bass", "Pbass", "Ikan Merak"],
    namaIlmiah: "Cichla ocellaris",
    namaEn: "Butterfly Peacock Bass",
    asal: "Amerika Selatan",
    statusInvasif: "TINGGI",
    ekosistemTerdampak: ["Danau buatan", "Waduk", "Sungai aliran besar yang bersih"],
    ciriIdentifikasi: ["Terdapat bulatan corak 'mata' (ocellus) palsu besar di pangkal ekor", "Warna dasar hijau atau emas kekuningan dengan garis vertikal (bar) tegas", "Mulut monyong lebar (bass-like)"],
    dampakEkologi: ["Pemangsa gerak cepat yang menyusutkan populasi ikan mas kecil atau pelagis lokal secara drastis", "Rakus dan kompetitor puncak di perairan pakan"],
    jalurEkonomi: {
      konsumsi: { available: true, pricePerKg: 35000, process: "Fillet panggang tebal karena kualitas daging putihnya padat (game fish grade)", difficulty: 'MUDAH', timeRequired: "Langsung" },
      ikanhias: { available: true, pricePerKg: 75000, process: "Sport fishing bernilai tinggi, tangkap hidup untuk ke penghobi predator", difficulty: 'SULIT', timeRequired: "2-3 hari karantina anti jamur" }
    },
    urgensiLaporan: "TINGGI",
    referensi: "Data Sport Fishing Indonesia",
    badgeName: "PemburuEksotis",
    badgeEmoji: "🦚",
    imageUrl: "/images/species/peacock_bass.png",
    funFact: "Cincin hitam menyerupai mata di bagian ekor (ocellus) berfungsi mengecoh predator atau mangsa agar menyerang bagian belakang tubuh alih-alih pelariannya."
  },
  "ikan-pelangi-invasif": {
    id: "ikan-pelangi-invasif",
    namaLokal: ["Rainbowfish Buangan", "Ikan Pelangi", "Melanotaenia spp asing"],
    namaIlmiah: "Melanotaenia spp.",
    namaEn: "Introduced/Hybrid Rainbowfish",
    asal: "Papua/Australia (namun dilepas invasif di zona Wallacea/Sunda)",
    statusInvasif: "RENDAH",
    ekosistemTerdampak: ["Sungai kecil", "Aliran parit irigasi", "Sistem karst"],
    ciriIdentifikasi: ["Sisik memantulkan kemilau warna-warni pelangi metalik saat terkena sinar terang", "Bentuk badan pipih dengan sirip punggung ganda terpisah"],
    dampakEkologi: ["Melakukan kawin silang (introgression/genetic pollution) memusnahkan galur murni endemik ketika dilepas di hotspot evolusi seperti Sulawesi"],
    jalurEkonomi: {
      ikanhias: { available: true, pricePerKg: 5000, process: "Ditangkap dengan serok lembut untuk disupply hidup ke pasar aquascape", difficulty: 'SEDANG', timeRequired: "Karantina filter harian" }
    },
    urgensiLaporan: "RENDAH",
    referensi: "Lipi/BRIN - Jurnal Iktiologi Indonesia",
    badgeName: "SiPelangi",
    badgeEmoji: "🌈",
    imageUrl: "/images/species/invasive_rainbowfish.png",
    funFact: "Kerusakan terbesarnya tidak terlihat (bukan memakan ikan), melainkan menghapus 100% gen genetik berharga ikan langka lokal dari peta."
  }
};

export function findSpeciesByName(query: string): InvasiveSpecies | undefined {
  if (!query) return undefined;
  const normalizedQuery = query.toLowerCase().trim();
  
  // Mencari dari alias di key
  if (SPECIES_DATABASE[normalizedQuery]) {
    return SPECIES_DATABASE[normalizedQuery];
  }
  
  // Mencari mendalam dari nama ilmiah, nama inggris, atau nama lokal
  for (const [, species] of Object.entries(SPECIES_DATABASE)) {
    if (species.namaIlmiah.toLowerCase().includes(normalizedQuery) || species.namaEn.toLowerCase().includes(normalizedQuery)) {
      return species;
    }
    for (const name of species.namaLokal) {
      if (name.toLowerCase().includes(normalizedQuery)) {
        return species;
      }
    }
  }
  return undefined;
}

export function getAllLocalNames(): string[] {
  const names = new Set<string>();
  for (const species of Object.values(SPECIES_DATABASE)) {
    species.namaLokal.forEach(name => names.add(name));
  }
  return Array.from(names);
}

export function getSpeciesByStatus(status: 'KRITIS' | 'TINGGI' | 'SEDANG' | 'RENDAH' | 'DARURAT'): InvasiveSpecies[] {
  const normalizedStatus = status.toUpperCase();
  return Object.values(SPECIES_DATABASE).filter(s => s.statusInvasif === normalizedStatus);
}

export function getSpeciesListForPrompt(): string {
  return Object.values(SPECIES_DATABASE)
    .map(s => `- ${s.namaIlmiah} (Nama Lokal: ${s.namaLokal.join(', ')}) [Status: ${s.statusInvasif}]`)
    .join('\n');
}
