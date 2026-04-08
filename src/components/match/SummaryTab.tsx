import { Badge } from '@/components/ui/badge';
import ClubLogo from '@/components/ClubLogo';
import { Target, Award, FileText, Info, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SummaryTabProps {
  fixture: any;
  result: any;
  homeClub: any;
  awayClub: any;
  matchDate: Date | null;
  homeWon: boolean;
  awayWon: boolean;
  statusLabel: string;
}

export default function SummaryTab({ fixture, result, homeClub, awayClub, matchDate, homeWon, awayWon, statusLabel }: SummaryTabProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);

  if (!result) {
    return (
      <div className="match-card p-8 text-center">
        <div className="text-3xl mb-3">🏈</div>
        <p className="text-sm font-semibold text-foreground mb-1">Match details available after the game</p>
        <p className="text-xs text-muted-foreground">Check back after kick-off for live scores and stats.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quarter Breakdown */}
      <div className="match-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Quarter by Quarter</h3>
        </div>
        <div className="px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-2 font-bold text-muted-foreground w-24"></th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q1</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q2</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q3</th>
                <th className="text-center py-2 font-bold text-muted-foreground">Q4</th>
                <th className="text-center py-2 font-black text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                    <span className={`font-bold truncate ${homeWon ? 'text-foreground' : 'text-muted-foreground'}`}>{homeClub?.short_name}</span>
                  </div>
                </td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q1 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q2 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q3 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.home_q4 || `${result.home_goals}.${result.home_behinds}`}</td>
                <td className={`text-center py-2.5 tabular-nums font-black text-sm ${homeWon ? 'text-primary' : ''}`}>{result.home_score}</td>
              </tr>
              <tr>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                    <span className={`font-bold truncate ${awayWon ? 'text-foreground' : 'text-muted-foreground'}`}>{awayClub?.short_name}</span>
                  </div>
                </td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q1 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q2 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q3 || '-'}</td>
                <td className="text-center py-2.5 tabular-nums text-muted-foreground">{result.away_q4 || `${result.away_goals}.${result.away_behinds}`}</td>
                <td className={`text-center py-2.5 tabular-nums font-black text-sm ${awayWon ? 'text-primary' : ''}`}>{result.away_score}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Goal Kickers */}
      {(result.goal_kickers_home?.length > 0 || result.goal_kickers_away?.length > 0) && (
        <div className="match-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Goal Kickers</h3>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                <ClubLogo club={homeClub ?? {}} size="sm" className="!h-5 !w-5" />
                <span className="font-bold text-xs">{homeClub?.short_name}</span>
              </div>
              <div className="space-y-1">
                {result.goal_kickers_home?.map((gk: string, i: number) => (
                  <div key={i} className="text-xs text-muted-foreground py-0.5">{gk}</div>
                )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border/30">
                <ClubLogo club={awayClub ?? {}} size="sm" className="!h-5 !w-5" />
                <span className="font-bold text-xs">{awayClub?.short_name}</span>
              </div>
              <div className="space-y-1">
                {result.goal_kickers_away?.map((gk: string, i: number) => (
                  <div key={i} className="text-xs text-muted-foreground py-0.5">{gk}</div>
                )) ?? <p className="text-xs text-muted-foreground/50 italic">—</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Notes */}
      {result.match_notes && (
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
