export interface BadgeDef {
  type: string;
  label: string;
  icon: string;
  description: string;
  tone: 'gold' | 'silver' | 'bronze' | 'fire' | 'ice';
}

export const BADGE_CATALOG: BadgeDef[] = [
  { type: 'premiership', label: 'Premiership', icon: '🏆', description: 'Won the grand final', tone: 'gold' },
  { type: 'runner_up', label: 'Runner-Up', icon: '🥈', description: 'Lost the grand final', tone: 'silver' },
  { type: 'minor_premiership', label: 'Minor Premiership', icon: '🥇', description: 'Finished top of the ladder', tone: 'gold' },
  { type: 'best_and_fairest', label: 'Best & Fairest', icon: '⭐', description: 'Coach of the highest performing side', tone: 'gold' },
  { type: 'coach_of_the_year', label: 'Coach of the Year', icon: '🎖️', description: 'Recognised as the season\'s top coach', tone: 'gold' },
  { type: 'wooden_spoon', label: 'Wooden Spoon', icon: '🥄', description: 'Finished bottom of the ladder', tone: 'bronze' },
  { type: 'finals_appearance', label: 'Finals Appearance', icon: '🎯', description: 'Reached the finals series', tone: 'ice' },
  { type: 'undefeated_season', label: 'Undefeated Season', icon: '🔥', description: 'Won every match in the season', tone: 'fire' },
];

export const getBadge = (type: string): BadgeDef =>
  BADGE_CATALOG.find(b => b.type === type) ?? { type, label: type, icon: '🏅', description: '', tone: 'silver' };

export const TONE_CLASSES: Record<BadgeDef['tone'], string> = {
  gold: 'bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-amber-500/40 text-amber-600 dark:text-amber-400',
  silver: 'bg-gradient-to-br from-slate-300/20 to-slate-500/10 border-slate-400/40 text-slate-600 dark:text-slate-300',
  bronze: 'bg-gradient-to-br from-orange-400/20 to-orange-700/10 border-orange-500/40 text-orange-600 dark:text-orange-400',
  fire: 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border-red-500/40 text-red-600 dark:text-red-400',
  ice: 'bg-gradient-to-br from-sky-400/20 to-blue-600/10 border-sky-500/40 text-sky-600 dark:text-sky-400',
};
