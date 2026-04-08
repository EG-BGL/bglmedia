import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { useParams, Link } from 'react-router-dom';
import { useFixture } from '@/hooks/useData';
import ClubLogo from '@/components/ClubLogo';
import { ChevronLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import MatchHero from '@/components/match/MatchHero';
import SummaryTab from '@/components/match/SummaryTab';
import PlayersTab from '@/components/match/PlayersTab';
import TeamsTab from '@/components/match/TeamsTab';
import NewsTab from '@/components/match/NewsTab';

const TABS = ['Summary', 'Players', 'Teams', 'News'] as const;
type Tab = typeof TABS[number];

export default function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const { data: fixture, isLoading } = useFixture(id!);
  const [activeTab, setActiveTab] = useState<Tab>('Summary');
  const [showStickyScore, setShowStickyScore] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyScore(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [fixture]);

  const result = (fixture as any)?.results?.[0];
  const homeClub = (fixture as any)?.home_team?.clubs;
  const awayClub = (fixture as any)?.away_team?.clubs;
  const matchDate = fixture?.scheduled_at ? new Date(fixture.scheduled_at) : null;

  if (isLoading) return <Layout><div className="page-container py-16 text-center text-sm text-muted-foreground">Loading match...</div></Layout>;
  if (!fixture) return <Layout><div className="page-container py-16 text-center text-sm text-muted-foreground">Match not found.</div></Layout>;

  const homeWon = result && result.home_score > result.away_score;
  const awayWon = result && result.away_score > result.home_score;
  const isDraw = result && result.home_score === result.away_score;
  const isCompleted = fixture.status === 'completed' && result;
  const isLive = fixture.status === 'in_progress';

  const statusLabel = isLive ? 'LIVE' : isCompleted ? 'FULL TIME' : 'UPCOMING';
  const statusClass = isLive
    ? 'bg-destructive text-destructive-foreground'
    : isCompleted
      ? 'bg-destructive text-destructive-foreground'
      : 'bg-primary/15 text-primary';

  return (
    <Layout>
      {/* Sticky mini score header */}
      {result && (
        <div className={`fixed top-14 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 transition-all duration-200 ${showStickyScore ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="page-container flex items-center justify-between h-11">
            <div className="flex items-center gap-2">
              <ClubLogo club={homeClub ?? {}} size="sm" className="!h-6 !w-6" />
              <span className="text-xs font-bold">{homeClub?.short_name}</span>
            </div>
            <div className="text-center">
              <span className="text-base font-black tabular-nums tracking-tight">
                {result.home_score}<span className="text-muted-foreground/30 mx-1">–</span>{result.away_score}
              </span>
              <Badge className={`ml-2 rounded-full text-[8px] font-black tracking-wider px-1.5 py-0 border-0 ${statusClass}`}>{statusLabel}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{awayClub?.short_name}</span>
              <ClubLogo club={awayClub ?? {}} size="sm" className="!h-6 !w-6" />
            </div>
          </div>
        </div>
      )}

      <div className="page-container py-4 space-y-3">
        {/* Back link */}
        <Link to="/fixtures" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Fixtures & Results
        </Link>

        {/* Hero Score */}
        <MatchHero
          fixture={fixture}
          result={result}
          homeClub={homeClub}
          awayClub={awayClub}
          matchDate={matchDate}
          homeWon={homeWon}
          awayWon={awayWon}
          isDraw={isDraw}
          statusLabel={statusLabel}
          statusClass={statusClass}
          isLive={isLive}
          heroRef={heroRef}
        />

        {/* Tab Bar */}
        <div className="match-card overflow-hidden p-1 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Summary' && (
          <SummaryTab
            fixture={fixture}
            result={result}
            homeClub={homeClub}
            awayClub={awayClub}
            matchDate={matchDate}
            homeWon={homeWon}
            awayWon={awayWon}
            statusLabel={statusLabel}
          />
        )}
        {activeTab === 'Players' && (
          <PlayersTab
            fixture={fixture}
            result={result}
            homeClub={homeClub}
            awayClub={awayClub}
          />
        )}
        {activeTab === 'Teams' && (
          <TeamsTab
            fixture={fixture}
            homeClub={homeClub}
            awayClub={awayClub}
          />
        )}
        {activeTab === 'News' && (
          <NewsTab
            homeClub={homeClub}
            awayClub={awayClub}
          />
        )}
      </div>
    </Layout>
  );
}
