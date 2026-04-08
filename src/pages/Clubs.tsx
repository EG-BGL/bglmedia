import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useClubs } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';

export default function Clubs() {
  const { data: clubs, isLoading } = useClubs();

  return (
    <Layout>
      <section className="sport-gradient py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black text-primary-foreground">Clubs</h1>
          <p className="text-primary-foreground/70 mt-1">Meet the teams of FootyLeague</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading clubs...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(clubs ?? []).map((club: any) => (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: club.primary_color }} />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-black shrink-0" style={{ backgroundColor: club.primary_color, color: club.secondary_color }}>
                        {club.short_name?.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{club.name}</h3>
                        <span className="text-xs text-muted-foreground font-medium">{club.short_name}</span>
                      </div>
                    </div>
                    {club.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{club.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {club.home_ground && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{club.home_ground}
                        </div>
                      )}
                      {club.founded_year && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Est. {club.founded_year}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
