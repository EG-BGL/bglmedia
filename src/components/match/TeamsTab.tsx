import ClubLogo from '@/components/ClubLogo';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMatchTeamStats } from '@/hooks/useData';

interface TeamsTabProps {
  fixture: any;
  homeClub: any;
  awayClub: any;
}

const STAT_DEFS = [
  { key: 'disposals', label: 'Disposals' },
  { key: 'kicks', label: 'Kicks' },
  { key: 'handballs', label: 'Handballs' },
  { key: 'tackles', label: 'Tackles' },
  { key: 'marks', label: 'Marks' },
  { key: 'contested_marks', label: 'Contested Marks' },
  { key: 'intercept_marks', label: 'Intercept Marks' },
  { key: 'spoils', label: 'Spoils' },
  { key: 'inside_50s', label: 'Inside 50s' },
  { key: 'rebound_50s', label: 'Rebound 50s' },
  { key: 'hitouts', label: 'Hitouts' },
  { key: 'clearances', label: 'Clearances' },
  { key: 'contested_possessions', label: 'Contested Possessions' },
  { key: 'uncontested_possessions', label: 'Uncontested Possessions' },
  { key: 'frees_for', label: 'Frees For' },
  { key: 'frees_against', label: 'Frees Against' },
  { key: 'fifty_m_penalties', label: '50m Penalties' },
] as const;

function StatSlider({ label, homeVal, awayVal, homeColor, awayColor }: {
  label: string;
  homeVal: number;
  awayVal: number;
  homeColor: string;
  awayColor: string;
}) {
  const total = homeVal + awayVal;
  const homePct = total > 0 ? (homeVal / total) * 100 : 50;
  const homeWon = homeVal > awayVal;
  const awayWon = awayVal > homeVal;

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs tabular-nums ${homeWon ? 'font-black text-foreground' : 'font-medium text-muted-foreground'}`}>{homeVal}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`text-xs tabular-nums ${awayWon ? 'font-black text-foreground' : 'font-medium text-muted-foreground'}`}>{awayVal}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted/30 gap-0.5">
        <div
          className="rounded-l-full transition-all duration-500 ease-out"
          style={{
            width: `${homePct}%`,
            backgroundColor: homeColor || 'hsl(var(--primary))',
            opacity: homeWon ? 1 : 0.4,
          }}
        />
        <div
          className="rounded-r-full transition-all duration-500 ease-out"
          style={{
            width: `${100 - homePct}%`,
            backgroundColor: awayColor || 'hsl(var(--primary))',
            opacity: awayWon ? 1 : 0.4,
          }}
        />
      </div>
    </div>
  );
}

function TeamCard({ club, label }: { club: any; label: string }) {
  if (!club) return null;

  return (
    <div className="match-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 font-black border-0">{label}</Badge>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <ClubLogo club={club} size="lg" className="!h-14 !w-14" />
          <div>
            <h3 className="text-sm font-black text-foreground">{club.name}</h3>
            <p className="text-xs text-muted-foreground">{club.short_name}</p>
          </div>
        </div>

        <dl className="space-y-2.5">
          {club.home_ground && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Home Ground</dt>
                <dd className="text-xs font-semibold text-foreground">{club.home_ground}</dd>
              </div>
            </div>
          )}
          {club.coach && (
            <div className="flex items-start gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Coach</dt>
                <dd className="text-xs font-semibold text-foreground">{club.coach}</dd>
              </div>
            </div>
          )}
          {club.contact_email && (
            <div className="flex items-start gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Contact</dt>
                <dd className="text-xs font-semibold text-foreground">{club.contact_email}</dd>
              </div>
            </div>
          )}
          {club.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">{club.description}</p>
          )}
        </dl>

        <Link to={`/clubs/${club.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3 hover:underline">
          <Shield className="h-3 w-3" /> View Club Profile
        </Link>
      </div>
    </div>
  );
}

export default function TeamsTab({ fixture, homeClub, awayClub }: TeamsTabProps) {
  const homeTeamId = (fixture as any)?.home_team?.id;
  const awayTeamId = (fixture as any)?.away_team?.id;
  const { data: teamStats, isLoading } = useMatchTeamStats(fixture?.id);

  const homeStats = teamStats?.find((s: any) => s.team_id === homeTeamId);
  const awayStats = teamStats?.find((s: any) => s.team_id === awayTeamId);
  const hasStats = !!homeStats || !!awayStats;

  const homeColor = homeClub?.primary_color || '#1a365d';
  const awayColor = awayClub?.primary_color || '#1a365d';

  return (
    <div className="space-y-3">
      {/* Team Stats Comparison */}
      {hasStats && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
              <span className="text-xs font-black">{homeClub?.short_name}</span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Team Stats</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black">{awayClub?.short_name}</span>
              <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
            </div>
          </div>
          <div className="px-4 py-1 divide-y divide-border/20">
            {STAT_DEFS.map(stat => (
              <StatSlider
                key={stat.key}
                label={stat.label}
                homeVal={(homeStats as any)?.[stat.key] ?? 0}
                awayVal={(awayStats as any)?.[stat.key] ?? 0}
                homeColor={homeColor}
                awayColor={awayColor}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading && !hasStats && (
        <div className="match-card overflow-hidden px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground/50">Loading team stats...</p>
        </div>
      )}

      {!isLoading && !hasStats && (
        <div className="match-card overflow-hidden px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground/50">No team stats recorded for this match</p>
        </div>
      )}

      <TeamCard club={homeClub} label="HOME" />
      <TeamCard club={awayClub} label="AWAY" />
    </div>
  );
}
