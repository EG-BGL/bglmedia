import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar } from 'lucide-react';
import { useFixtures, useCurrentSeason } from '@/hooks/useData';
import { useState } from 'react';

export default function Fixtures() {
  const { data: season } = useCurrentSeason();
  const { data: fixtures, isLoading } = useFixtures(season?.id);
  const [selectedRound, setSelectedRound] = useState<string>('all');

  const rounds = [...new Set(fixtures?.map(f => f.round_number) ?? [])].sort((a, b) => a - b);
  const filtered = selectedRound === 'all' ? fixtures : fixtures?.filter(f => f.round_number === Number(selectedRound));

  const groupedByRound: Record<number, any[]> = {};
  (filtered ?? []).forEach((f: any) => {
    if (!groupedByRound[f.round_number]) groupedByRound[f.round_number] = [];
    groupedByRound[f.round_number].push(f);
  });

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black text-primary-foreground">Fixtures</h1>
          <p className="text-primary-foreground/70 mt-1">{season?.name ?? '2026'} Season Schedule</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by round" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {rounds.map(r => (
                <SelectItem key={r} value={String(r)}>Round {r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading fixtures...</p>
        ) : Object.keys(groupedByRound).length === 0 ? (
          <p className="text-muted-foreground">No fixtures found.</p>
        ) : (
          Object.entries(groupedByRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
            <div key={round} className="mb-8">
              <h2 className="text-lg font-bold mb-3">Round {round}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((f: any) => (
                  <Card key={f.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={f.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                          {f.status === 'completed' ? 'Completed' : f.status === 'scheduled' ? 'Upcoming' : f.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: f.home_team?.clubs?.primary_color, color: f.home_team?.clubs?.secondary_color }}>
                            {f.home_team?.clubs?.short_name?.slice(0, 2)}
                          </div>
                          <span className="font-semibold text-sm">{f.home_team?.clubs?.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs font-medium">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{f.away_team?.clubs?.name}</span>
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: f.away_team?.clubs?.primary_color, color: f.away_team?.clubs?.secondary_color }}>
                            {f.away_team?.clubs?.short_name?.slice(0, 2)}
                          </div>
                        </div>
                      </div>
                      {f.venue && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{f.venue}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
