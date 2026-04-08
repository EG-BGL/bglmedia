import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Trophy, Users, User, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Fixtures', path: '/fixtures', icon: Calendar },
  { label: 'Submit', path: '/portal/submit', icon: ClipboardList, authOnly: true },
  { label: 'Ladder', path: '/ladder', icon: Trophy },
  { label: 'Clubs', path: '/clubs', icon: Users },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const { user, role } = useAuth();

  const profilePath = user ? '/portal' : '/login';
  const isCoachOrAdmin = role === 'coach' || role === 'league_admin';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/profile') return location.pathname === '/portal' || location.pathname === '/login';
    return location.pathname.startsWith(path);
  };

  const visibleTabs = tabs.filter(tab => !tab.authOnly || (user && isCoachOrAdmin));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const href = tab.path === '/profile' ? profilePath : tab.path;
          const active = isActive(tab.path);
          const isSubmit = tab.path === '/portal/submit';
          return (
            <Link
              key={tab.label}
              to={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isSubmit
                  ? 'text-primary'
                  : active
                    ? 'text-primary'
                    : 'text-muted-foreground'
              }`}
            >
              {isSubmit ? (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center -mt-3 shadow-lg">
                  <Icon className="h-4 w-4 text-primary-foreground stroke-[2.5]" />
                </div>
              ) : (
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              )}
              <span className={`text-[10px] leading-none ${isSubmit ? 'font-bold text-primary' : active ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
