export interface GamificationState {
  reportCount: number;
  rank: string;
}

export const RANKS = [
  { threshold: 0, name: 'Pemula', en: 'Beginner', icon: '🌱', color: 'bg-white/10 text-white border-white/20' },
  { threshold: 1, name: 'Penjaga Sungai', en: 'River Guard', icon: '💧', color: 'bg-emerald-500 text-white border-emerald-400' },
  { threshold: 5, name: 'Ksatria Perairan', en: 'Water Knight', icon: '🛡️', color: 'bg-blue-500 text-white border-blue-400' },
  { threshold: 10, name: 'Pahlawan Ekosistem', en: 'Ecosystem Hero', icon: '🌟', color: 'bg-purple-500 text-white border-purple-400' },
  { threshold: 25, name: 'Legenda SiJaga', en: 'SiJaga Legend', icon: '👑', color: 'bg-amber-500 text-white border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' },
];

export function getGamificationState(): GamificationState {
  if (typeof window === 'undefined') return { reportCount: 0, rank: RANKS[0].name };
  const count = parseInt(localStorage.getItem('sijaga_report_count') || '0', 10);
  return { reportCount: count, rank: getRankForCount(count).name };
}

export function getRankForCount(count: number) {
  return [...RANKS].reverse().find(r => count >= r.threshold) || RANKS[0];
}

export function addGamificationReport(): { isNewRank: boolean, newRank: string, newRankEn: string, newIcon: string } {
  if (typeof window === 'undefined') return { isNewRank: false, newRank: '', newRankEn: '', newIcon: '' };
  
  const count = parseInt(localStorage.getItem('sijaga_report_count') || '0', 10);
  const newCount = count + 1;
  localStorage.setItem('sijaga_report_count', newCount.toString());
  
  const oldRank = getRankForCount(count);
  const newRankObj = getRankForCount(newCount);
  
  // Trigger event for Navbar to update
  window.dispatchEvent(new Event('gamification_update'));

  return {
    isNewRank: oldRank.name !== newRankObj.name,
    newRank: newRankObj.name,
    newRankEn: newRankObj.en,
    newIcon: newRankObj.icon
  };
}
