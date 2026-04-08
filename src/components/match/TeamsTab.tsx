import ClubLogo from '@/components/ClubLogo';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TeamsTabProps {
  fixture: any;
  homeClub: any;
  awayClub: any;
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
  return (
    <div className="space-y-3">
      <TeamCard club={homeClub} label="HOME" />
      <TeamCard club={awayClub} label="AWAY" />
    </div>
  );
}
