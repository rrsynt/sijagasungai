'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { ShieldCheck, ShieldAlert, Award, RefreshCw, HelpCircle, Trophy } from 'lucide-react';

interface GameCard {
  nameId: string;
  nameEn: string;
  scientific: string;
  emoji: string;
  isInvasive: boolean;
  factId: string;
  factEn: string;
}

const GAME_CARDS: GameCard[] = [
  {
    nameId: 'Ikan Sapu-sapu',
    nameEn: 'Suckermouth Catfish',
    scientific: 'Pterygoplichthys pardalis',
    emoji: '🧹',
    isInvasive: true,
    factId: 'Mengikis dasar sungai, merusak sarang telur ikan lokal, dan sangat tahan polusi.',
    factEn: 'Erodes riverbeds, destroys native fish nests, and is highly pollution tolerant.'
  },
  {
    nameId: 'Ikan Gurame',
    nameEn: 'Giant Gourami',
    scientific: 'Osphronemus goramy',
    emoji: '🍽️',
    isInvasive: false,
    factId: 'Ikan asli perairan tawar Indonesia (Sunda), aman dan bernilai ekonomi tinggi.',
    factEn: 'Native Indonesian freshwater fish, safe and highly commercial.'
  },
  {
    nameId: 'Aligator Gar',
    nameEn: 'Alligator Gar',
    scientific: 'Atractosteus spatula',
    emoji: '🐊',
    isInvasive: true,
    factId: 'Predator raksasa Amerika yang menyapu bersih ikan lokal. Dilarang dipelihara/dilepas.',
    factEn: 'Giant American predator that wipes out native fish. Banned from pet trade/release.'
  },
  {
    nameId: 'Ikan Nilem',
    nameEn: 'Bonylip Barb',
    scientific: 'Osteochilus vittatus',
    emoji: '🌾',
    isInvasive: false,
    factId: 'Ikan endemik Jawa-Sumatra. Sering dimanfaatkan untuk terapi kaki dan konsumsi.',
    factEn: 'Endemic Java-Sumatran fish. Often used for feet therapy and consumption.'
  },
  {
    nameId: 'Arapaima Gigas',
    nameEn: 'Arapaima',
    scientific: 'Arapaima gigas',
    emoji: '🐉',
    isInvasive: true,
    factId: 'Ikan raksasa Amazon (bisa 3 meter). Merusak seluruh rantai makanan perairan lokal.',
    factEn: 'Giant Amazon fish (up to 3 meters). Destroys the entire local aquatic food chain.'
  },
  {
    nameId: 'Ikan Tawes',
    nameEn: 'Java Barb',
    scientific: 'Barbonymus gonionotus',
    emoji: '🐟',
    isInvasive: false,
    factId: 'Ikan asli Indonesia. Herbivora yang membantu mengendalikan gulma air berlebih.',
    factEn: 'Native Indonesian fish. Herbivore that helps control excess aquatic weeds.'
  },
  {
    nameId: 'Red Devil',
    nameEn: 'Red Devil Cichlid',
    scientific: 'Amphilophus labiatus',
    emoji: '👹',
    isInvasive: true,
    factId: 'Sangat teritorial dan agresif memangsa benih ikan lokal di waduk-waduk Indonesia.',
    factEn: 'Highly territorial and aggressively preys on native fingerlings in reservoirs.'
  },
  {
    nameId: 'Ikan Gabus Haruan',
    nameEn: 'Snakehead Murrel',
    scientific: 'Channa striata',
    emoji: '🧪',
    isInvasive: false,
    factId: 'Ikan predator asli Indonesia barat. Kaya albumin untuk mempercepat penyembuhan luka.',
    factEn: 'Native predator in western Indonesia. Rich in albumin for wound healing.'
  },
  {
    nameId: 'Ikan Piranha',
    nameEn: 'Red-bellied Piranha',
    scientific: 'Pygocentrus nattereri',
    emoji: '🦷',
    isInvasive: true,
    factId: 'Karnivora gigi tajam Amazon. Berbahaya bagi keselamatan manusia dan fauna lokal.',
    factEn: 'Sharp-toothed Amazon carnivore. Dangerous to human safety and local fauna.'
  },
  {
    nameId: 'Ikan Betok',
    nameEn: 'Climbing Perch',
    scientific: 'Anabas testudineus',
    emoji: '🐾',
    isInvasive: false,
    factId: 'Ikan labirin asli Indonesia. Mampu memanjat tebing lumpur basah dan berjalan di darat.',
    factEn: 'Native labyrinth fish. Capable of climbing wet mud banks and walking on land.'
  }
];

export function ClassifierGame() {
  const { t } = useLanguage();
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'feedback' | 'finished'>('welcome');
  const [activeDeck, setActiveDeck] = useState<GameCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedInvasive, setSelectedInvasive] = useState<boolean | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState(false);

  const startNewGame = () => {
    // Pick 5 random unique cards
    const shuffled = [...GAME_CARDS].sort(() => 0.5 - Math.random());
    setActiveDeck(shuffled.slice(0, 5));
    setCurrentIndex(0);
    setScore(0);
    setSelectedInvasive(null);
    setUnlockedBadge(false);
    setGameState('playing');
  };

  const handleGuess = (guessInvasive: boolean) => {
    setSelectedInvasive(guessInvasive);
    const correct = guessInvasive === activeDeck[currentIndex].isInvasive;
    if (correct) {
      setScore(prev => prev + 1);
    }
    setGameState('feedback');
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeDeck.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedInvasive(null);
      setGameState('playing');
    } else {
      // Award badge if score is perfect (5/5)
      const finalScore = score + (selectedInvasive === activeDeck[currentIndex].isInvasive ? 1 : 0);
      let badgeAdded = false;
      if (finalScore === 5) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 }
          });
        });
        const stored = localStorage.getItem('sijaga_badges');
        const badges = stored ? JSON.parse(stored) : [];
        const badgeName = '🏆 Ahli Taksonomi';
        if (!badges.includes(badgeName)) {
          badges.push(badgeName);
          localStorage.setItem('sijaga_badges', JSON.stringify(badges));
          badgeAdded = true;
          // Notify education landing to refresh its badge display
          window.dispatchEvent(new Event('sijaga_badges_update'));
        }
      }
      setUnlockedBadge(badgeAdded);
      setGameState('finished');
    }
  };

  const activeCard = activeDeck[currentIndex];

  return (
    <div className="bg-white border-2 border-gray-900 p-8 sm:p-10 max-w-xl mx-auto shadow-md">
      {gameState === 'welcome' && (
        <div className="text-center py-6">
          <HelpCircle className="w-16 h-16 text-primary-sunai mx-auto mb-6" />
          <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3">
            {t('Tantangan Taksonomi', 'Taxonomy Challenge')}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            {t(
              'Uji kemampuanmu membedakan spesies invasif berbahaya dengan ikan lokal asli Nusantara. Dapatkan badge spesial dengan skor sempurna 5/5!',
              'Test your ability to classify dangerous invasive species from native species. Earn a special badge with a perfect 5/5 score!'
            )}
          </p>
          <button
            onClick={startNewGame}
            className="px-8 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors w-full"
          >
            {t('Mulai Bermain', 'Start Playing')}
          </button>
        </div>
      )}

      {gameState === 'playing' && activeCard && (
        <div className="text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-6">
            {t(`PERTANYAAN ${currentIndex + 1} DARI 5`, `QUESTION ${currentIndex + 1} OF 5`)}
          </span>

          {/* Card visualizer */}
          <div className="border-2 border-gray-900 p-8 bg-gray-50 flex flex-col items-center justify-center min-h-[220px] mb-8 relative">
            <span className="text-7xl mb-4 select-none">{activeCard.emoji}</span>
            <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {t(activeCard.nameId, activeCard.nameEn)}
            </h4>
            <p className="text-sm italic text-gray-500 mt-1">{activeCard.scientific}</p>
          </div>

          <p className="text-sm text-gray-600 mb-8 font-medium">
            {t('Manakah kategori yang tepat untuk spesies ini?', 'Which category does this species belong to?')}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleGuess(true)}
              className="flex items-center justify-center gap-2 py-4 border-2 border-red-600 text-red-700 hover:bg-red-50 text-xs font-black uppercase tracking-widest transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              {t('INVASIF', 'INVASIVE')}
            </button>
            <button
              onClick={() => handleGuess(false)}
              className="flex items-center justify-center gap-2 py-4 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-black uppercase tracking-widest transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              {t('AMAN / ASLI', 'SAFE / NATIVE')}
            </button>
          </div>
        </div>
      )}

      {gameState === 'feedback' && activeCard && (
        <div className="text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">
            {t(`HASIL PERTANYAAN ${currentIndex + 1}`, `RESULT OF QUESTION ${currentIndex + 1}`)}
          </span>

          {/* Feedback Icon / Header */}
          {selectedInvasive === activeCard.isInvasive ? (
            <div className="text-emerald-600 mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight">{t('JAWABAN BENAR!', 'CORRECT ANSWER!')}</h4>
            </div>
          ) : (
            <div className="text-red-600 mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight">{t('JAWABAN SALAH', 'INCORRECT ANSWER')}</h4>
            </div>
          )}

          {/* Explanation box */}
          <div className="border-2 border-gray-900 p-6 bg-gray-50 text-left mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{activeCard.emoji}</span>
              <div>
                <p className="font-extrabold text-gray-900 uppercase tracking-wide text-xs">
                  {t(activeCard.nameId, activeCard.nameEn)}
                </p>
                <p className="text-[10px] text-gray-500 italic">{activeCard.scientific}</p>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('Kategori Resmi:', 'Official Category:')}</p>
            <p className={`text-sm font-black uppercase tracking-wider mb-3 ${activeCard.isInvasive ? 'text-red-700' : 'text-emerald-700'}`}>
              {activeCard.isInvasive ? t('INVASIF (DILARANG/KRITIS)', 'INVASIVE (BANNED/CRITICAL)') : t('AMAN (ASLI / NON-INVASIF)', 'SAFE (NATIVE / NON-INVASIVE)')}
            </p>
            <p className="text-xs text-gray-700 leading-relaxed border-t border-gray-200 pt-3">
              <strong>{t('Fakta:', 'Fact:')}</strong> {t(activeCard.factId, activeCard.factEn)}
            </p>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            {currentIndex + 1 < activeDeck.length ? t('Pertanyaan Berikutnya →', 'Next Question →') : t('Lihat Skor Akhir', 'See Final Score')}
          </button>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="text-center py-4">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-6 animate-bounce" />
          <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
            {t('Permainan Selesai!', 'Game Completed!')}
          </h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-8">
            {t('SKOR ANDA:', 'YOUR SCORE:')} <span className="text-lg text-gray-900">{score} / 5</span>
          </p>

          <div className="border-2 border-gray-900 p-6 bg-amber-50 text-left mb-8">
            {score === 5 ? (
              <div className="flex items-start gap-4">
                <Award className="w-10 h-10 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-amber-900 uppercase tracking-widest text-xs mb-1">
                    {t('Unlocked: Badge Ahli Taksonomi!', 'Unlocked: Taxonomy Master Badge!')}
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t(
                      'Selamat! Pengetahuanmu tentang ekosistem air tawar Indonesia sangat mengesankan. Badge baru telah ditambahkan ke profilmu.',
                      'Congratulations! Your knowledge of Indonesian freshwater ecosystems is outstanding. A new badge has been added to your profile.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <HelpCircle className="w-10 h-10 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-1">
                    {t('Sedikit Lagi Sempurna!', 'Almost Perfect!')}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(
                      'Butuh skor 5/5 untuk mendapatkan Badge Spesial. Coba main lagi untuk menyempurnakan pemahamanmu tentang spesies invasif.',
                      'You need a score of 5/5 to unlock the Special Badge. Play again to master your knowledge of invasive species.'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startNewGame}
              className="flex items-center justify-center gap-2 py-4 border-2 border-gray-900 hover:bg-gray-50 text-xs font-black uppercase tracking-widest transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {t('Main Lagi', 'Play Again')}
            </button>
            <button
              onClick={() => setGameState('welcome')}
              className="py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              {t('Kembali', 'Back')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
