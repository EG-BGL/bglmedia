import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, BarChart3, Users, ChevronRight } from 'lucide-react';
import bglLogo from '@/assets/bgl-logo.jpeg';

const features = [
  { icon: Calendar, label: 'Fixtures & Results', desc: 'Stay up to date with all upcoming games and past results' },
  { icon: BarChart3, label: 'Live Ladder', desc: 'Track team standings updated after every round' },
  { icon: Users, label: 'Player Stats', desc: 'Detailed player statistics and match performance' },
  { icon: Trophy, label: 'Match Centre', desc: 'Full scorecards, team stats and goal kickers' },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 sport-gradient opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative flex flex-col items-center justify-center px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <img src={bglLogo} alt="BGLMedia" className="h-20 w-auto mb-6 rounded-xl shadow-lg" />
          <h1 className="text-3xl md:text-5xl font-black text-primary-foreground tracking-tight leading-tight max-w-lg">
            Your Local Footy,<br />All In One Place
          </h1>
          <p className="mt-4 text-sm md:text-base text-primary-foreground/70 max-w-md leading-relaxed">
            Fixtures, results, ladders and player stats — everything you need to follow your club this season.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
            <Button asChild size="lg" className="flex-1 font-bold text-base rounded-xl h-12">
              <Link to="/home">
                Enter App <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1 font-bold text-base rounded-xl h-12 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-12 md:py-16 max-w-2xl mx-auto w-full">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mb-8">What's Inside</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.label} className="bg-card rounded-xl border border-border/60 p-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm">{f.label}</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BGLMedia. All rights reserved.</p>
      </div>
    </div>
  );
}
