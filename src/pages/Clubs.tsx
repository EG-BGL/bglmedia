import Layout from '@/components/layout/Layout';
import { useClubs } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';

export default function Clubs() {
  const { data: clubs, isLoading } = useClubs();

  return (
    <Layout>
      <div className="page-container py-5 space-y-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">Clubs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Meet the teams of the SDFL</p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {(clubs ?? []).map((club: any) => (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <div className="match-card p-4 text-center group">
                  <ClubLogo club={club} size="lg" className="mx-auto !h-14 !w-14 mb-2 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="font-bold text-sm">{club.name}</h3>
                  {club.home_ground && (
                    <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />{club.home_ground}
                    </div>
                  )}
                  {club.founded_year && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">Est. {club.founded_year}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
