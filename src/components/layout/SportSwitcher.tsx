import { useSport } from '@/hooks/useSport';
import { CircleDot } from 'lucide-react';

// Simple AFL icon as inline SVG
function AflIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <ellipse cx="12" cy="12" rx="6" ry="9" strokeWidth="2" stroke="currentColor" fill="none" />
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6.5" y1="8" x2="17.5" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="6.5" y1="16" x2="17.5" y2="16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CricketIcon({ className }: { className?: string }) {
  return <CircleDot className={className} />;
}

export default function SportSwitcher() {
  const { sports, currentSport, setSport } = useSport();

  if (sports.length <= 1) return null;

  return (
    <div className="flex items-center bg-muted/60 rounded-full p-0.5 gap-0.5">
      {sports.map((sport) => {
        const active = currentSport?.slug === sport.slug;
        const Icon = sport.slug === 'cricket' ? CricketIcon : AflIcon;
        return (
          <button
            key={sport.id}
            onClick={() => setSport(sport.slug)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{sport.slug === 'afl' ? 'AFL' : 'Cricket'}</span>
          </button>
        );
      })}
    </div>
  );
}
