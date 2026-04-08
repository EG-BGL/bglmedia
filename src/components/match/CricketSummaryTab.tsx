import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Info, FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useCricketMatchResults } from '@/hooks/useCricketData';

interface CricketSummaryTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  statusLabel: string;
}

export default function CricketSummaryTab({ fixture, result, homeClub, awayClub, matchDate, statusLabel }: CricketSummaryTabProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const { data: inningsData } = useCricketMatchResults(fixture?.id);

  const homeTeamId = fixture?.home_team?.id;
  const awayTeamId = fixture?.away_team?.id;

  const getClub = (teamId: string) => teamId === homeTeamId ? homeClub : awayClub;

  // Group innings by team
  const homeInnings = inningsData?.filter((i: any) => i.team_id === homeTeamId) ?? [];
  const awayInnings = inningsData?.filter((i: any) => i.team_id === awayTeamId) ?? [];

  const hasInnings = inningsData && inningsData.length > 0;

  if (!hasInnings && !result) {
    return (
      <div className="match-card p-8 text-center">
        <div className="text-3xl mb-3">🏏</div>
        <p className="text-sm font-semibold text-foreground mb-1">Match details available after the game</p>
        <p className="text-xs text-muted-foreground">Check back after the toss for live scores and stats.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Innings Breakdown */}
      {hasInnings && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Innings Summary</h3>
          </div>
          <div className="divide-y divide-border/30">
            {(inningsData ?? []).map((inn: any) => {
              const club = getClub(inn.team_id);
              const wicketText = inn.all_out ? 'All Out' : `${inn.total_wickets} wkts`;
              const oversText = `${inn.total_overs} ov`;
              return (
                <div key={inn.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ClubLogo club={club ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="text-xs font-bold">{club?.short_name}</span>
                      <Badge variant="secondary" className="text-[9px] rounded-full px-1.5 py-0 font-bold border-0">
                        {inn.innings_number === 1 ? '1st Innings' : '2nd Innings'}
                      </Badge>
                      {inn.declared && (
                        <Badge className="text-[9px] rounded-full px-1.5 py-0 font-bold bg-accent/20 text-accent border-0">Dec</Badge>
                      )}
                      {inn.follow_on && (
                        <Badge className="text-[9px] rounded-full px-1.5 py-0 font-bold bg-destructive/20 text-destructive border-0">F/O</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black tabular-nums">{inn.total_runs}/{inn.total_wickets}</span>
                    <span className="text-xs text-muted-foreground">({oversText})</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                    <span>RR: <span className="font-bold text-foreground">{Number(inn.run_rate).toFixed(2)}</span></span>
                    <span>Extras: <span className="font-bold text-foreground">{inn.extras ?? 0}</span></span>
                    {inn.all_out && <span className="font-bold text-destructive">All Out</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scorecard comparison table */}
      {(homeInnings.length > 0 || awayInnings.length > 0) && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Score Comparison</h3>
          </div>
          <div className="px-4 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-2 font-bold text-muted-foreground"></th>
                  {homeInnings.map((inn: any) => (
                    <th key={`h-${inn.innings_number}`} className="text-center py-2 font-bold text-muted-foreground">
                      {inn.innings_number === 1 ? '1st' : '2nd'}
                    </th>
                  ))}
                  <th className="text-center py-2 font-black text-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20">
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold truncate">{homeClub?.short_name}</span>
                    </div>
                  </td>
                  {homeInnings.map((inn: any) => (
                    <td key={inn.id} className="text-center py-2.5 tabular-nums">
                      {inn.total_runs}/{inn.total_wickets}
                      {inn.declared && <span className="text-[8px] text-accent ml-0.5">d</span>}
                    </td>
                  ))}
                  <td className="text-center py-2.5 tabular-nums font-black text-sm text-primary">
                    {homeInnings.reduce((sum: number, inn: any) => sum + (inn.total_runs ?? 0), 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                      <span className="font-bold truncate">{awayClub?.short_name}</span>
                    </div>
                  </td>
                  {awayInnings.map((inn: any) => (
                    <td key={inn.id} className="text-center py-2.5 tabular-nums">
                      {inn.total_runs}/{inn.total_wickets}
                      {inn.declared && <span className="text-[8px] text-accent ml-0.5">d</span>}
                    </td>
                  ))}
                  <td className="text-center py-2.5 tabular-nums font-black text-sm text-primary">
                    {awayInnings.reduce((sum: number, inn: any) => sum + (inn.total_runs ?? 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Match Notes */}
      {result?.match_notes && (
        <div className="match-card overflow-hidden">
          <button onClick={() => setNotesExpanded(!notesExpanded)} className="w-full px-4 py-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Match Notes</h3>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${notesExpanded ? 'rotate-180' : ''}`} />
          </button>
          {notesExpanded && (
            <div className="px-4 pb-4 border-t border-border/30 pt-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{result.match_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Match Info */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Match Info</h3>
        </div>
        <div className="px-4 py-2">
          <dl className="divide-y divide-border/30">
            {[
              { label: 'Round', value: `Round ${fixture.round_number}` },
              fixture.match_format && { label: 'Format', value: fixture.match_format },
              matchDate && { label: 'Date', value: matchDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              matchDate && { label: 'Time', value: matchDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) },
              fixture.venue && { label: 'Venue', value: fixture.venue },
              { label: 'Status', value: statusLabel },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="text-xs font-semibold text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
