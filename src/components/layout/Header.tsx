import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ClipboardList, Shield, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import bglLogo from '@/assets/bgl-logo.jpeg';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Fixtures & Results', path: '/fixtures' },
  { label: 'Ladder', path: '/ladder' },
  { label: 'Clubs', path: '/clubs' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
      <div className="page-container flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={bglLogo} alt="BGLMedia" className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
        <nav className="flex items-center bg-muted/60 rounded-full p-1 gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {user && (role === 'coach' || role === 'league_admin') && (
            <Button asChild size="sm" className="rounded-full font-bold gap-1.5 h-8 px-4 text-xs">
              <Link to="/portal/submit"><ClipboardList className="h-3.5 w-3.5" />Submit</Link>
            </Button>
          )}
          {user ? (
            <div className="flex items-center gap-1">
              {(role === 'coach' || role === 'league_admin') && (
                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" title="Coach Hub">
                  <Link to="/coach-hub"><BarChart3 className="h-4 w-4" /></Link>
                </Button>
              )}
              {role === 'league_admin' && (
                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <Link to="/admin"><Shield className="h-4 w-4" /></Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" title="Profile">
                <Link to="/profile"><User className="h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full h-8 text-xs font-semibold">
              <Link to="/login"><User className="h-3.5 w-3.5 mr-1" />Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-1">
          {user && (role === 'coach' || role === 'league_admin') && (
            <Button asChild size="sm" className="rounded-full font-bold gap-1 h-8 px-3 text-xs">
              <Link to="/portal/submit"><ClipboardList className="h-3.5 w-3.5" />Submit</Link>
            </Button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -mr-2 text-foreground"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu - account actions only (bottom nav handles page navigation) */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-card animate-in slide-in-from-top-1 duration-150">
          <nav className="page-container flex flex-col py-2 gap-0.5">
            {user ? (
              <>
                {(role === 'coach' || role === 'league_admin') && (
                  <Link to="/portal" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted font-medium text-sm">
                    <User className="h-4 w-4 opacity-60" /> Dashboard
                  </Link>
                )}
                {role === 'league_admin' && (
                  <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted font-medium text-sm">
                    <Shield className="h-4 w-4 opacity-60" /> Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 font-medium text-sm w-full text-left"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                <User className="h-4 w-4" /> Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
