'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CheckCircle, XCircle, Award, Lightbulb } from 'lucide-react';

interface QuizQuestion {
  soal: string;
  opsi: { A: string; B: string; C: string; D: string };
  jawaban: string; // "A" | "B" | "C" | "D"
  penjelasan: string;
  tingkat: string;
}

interface QuizPanelProps {
  speciesId: string;
  onFinish?: (badge: string) => void;
}

export function QuizPanel({ speciesId, onFinish }: QuizPanelProps) {
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/education/quiz/${speciesId}?lang=${language}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.kuis)) {
          setQuestions(data.data.kuis); 
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [speciesId, language]);

  useEffect(() => {
    if (finished) {
      if (score === questions.length) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        });
      }
      if (onFinish) {
        const badgeTitle = score === questions.length ? t('Pakar', 'Expert') : t('Pengamat', 'Observer');
        onFinish(`${badgeTitle} (${speciesId})`);
      }
    }
  }, [finished, score, questions.length, speciesId, onFinish, t]);

  if (loading) {
    return <div className="py-12"><LoadingSpinner text={t('Menyiapkan kuis...', 'Preparing quiz...')} /></div>;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return <div className="p-6 text-center text-gray-500">{t('Kuis tidak tersedia.', 'Quiz not available.')}</div>;
  }

  if (finished) {
    const badgeName = score === questions.length ? '🥇 ' + t('Pakar', 'Expert') : '🥈 ' + t('Pengamat', 'Observer');
    return (
      <div className="text-center py-10 animate-in zoom-in-95 duration-500 space-y-6">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
          <Award className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('Kuis Selesai!', 'Quiz Finished!')}</h3>
          <p className="text-gray-600">
            {t('Skor Anda:', 'Your Score:')} <span className="font-bold text-gray-900">{score}</span> / {questions.length}
          </p>
        </div>
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full shadow-md">
          {t('Badge Diperoleh:', 'Badge Earned:')} {badgeName}
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const isCorrect = selectedOption === q.jawaban;

  const handleOptionClick = (key: string) => {
    if (showExplanation) return;
    setSelectedOption(key);
    setShowExplanation(true);
    if (key === q.jawaban) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="space-y-6 py-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
        <div>
          <span className="text-sm font-semibold text-gray-500 block mb-1">{t('Pertanyaan', 'Question')} {currentIdx + 1} / {questions.length}</span>
          <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-md tracking-wider">{q.tingkat}</span>
        </div>
        <span className="text-sm font-bold text-gray-900 px-3 py-1 bg-gray-100 rounded-lg">{t('Skor', 'Score')}: {score}</span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 leading-relaxed mb-6">{q.soal}</h3>

      <div className="space-y-3">
        {Object.entries(q.opsi).map(([key, opt]) => {
          let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex items-center group ";
          if (!showExplanation) {
            btnClass += "border-gray-200 bg-white hover:border-primary-sunai hover:bg-primary-sunai/5 text-gray-700";
          } else {
            if (key === q.jawaban) {
              btnClass += "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20";
            } else if (key === selectedOption) {
              btnClass += "border-red-500 bg-red-50 text-red-900";
            } else {
               btnClass += "border-gray-200 bg-gray-50 text-gray-400 opacity-50";
            }
          }

          return (
            <button
              key={key}
              onClick={() => handleOptionClick(key)}
              disabled={showExplanation}
              className={btnClass}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold mr-4 shrink-0 transition-colors ${!showExplanation ? 'bg-gray-100 text-gray-500 group-hover:bg-primary-sunai/20 group-hover:text-primary-sunai' : key === q.jawaban ? 'bg-emerald-200 text-emerald-800' : key === selectedOption ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-400'}`}>
                {key}
              </div>
              <div className="flex-1">
                <span>{opt}</span>
              </div>
              {showExplanation && key === q.jawaban && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 ml-3" />}
              {showExplanation && key === selectedOption && key !== q.jawaban && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-3" />}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-top-4 shadow-sm">
          <div className="flex items-start mb-6">
            <Lightbulb className="w-6 h-6 text-amber-500 mr-3 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-widest text-xs block mb-1 text-blue-800">{t('Penjelasan', 'Explanation')}</span>
              <p className="text-blue-900 text-sm leading-relaxed">
                {q.penjelasan}
              </p>
            </div>
          </div>
          <button 
            onClick={nextQuestion}
            className="w-full py-4 bg-primary-sunai hover:bg-primary-sunai/90 text-white font-bold rounded-xl transition-all shadow-md flex justify-center items-center"
          >
            {currentIdx < questions.length - 1 ? t('Pertanyaan Selanjutnya', 'Next Question') : t('Lihat Hasil Akhir', 'View Final Results')}
          </button>
        </div>
      )}
    </div>
  );
}
