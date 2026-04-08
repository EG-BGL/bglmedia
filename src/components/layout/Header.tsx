import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Fixtures', path: '/fixtures' },
  { label: 'Results', path: '/results' },
  { label: 'Ladder', path: '/ladder' },
  { label: 'Clubs', path: '/clubs' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sport-gradient sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-black text-accent-foreground text-lg">
            FL
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-primary-foreground leading-tight">FootyLeague</div>
            <div className="text-xs text-primary-foreground/70">Community Football</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{role === 'league_admin' ? 'Admin' : role === 'coach' ? 'Coach' : 'Account'}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(role === 'coach' || role === 'league_admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/portal">Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {role === 'league_admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary-foreground p-2"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary-foreground/10 pb-4">
          <nav className="flex flex-col px-4 pt-2 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-primary-foreground/80 hover:bg-primary-foreground/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-primary-foreground/10 mt-2 pt-2">
              {user ? (
                <>
                  {(role === 'coach' || role === 'league_admin') && (
                    <Link to="/portal" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-primary-foreground/80">Dashboard</Link>
                  )}
                  {role === 'league_admin' && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-primary-foreground/80">Admin Panel</Link>
                  )}
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-destructive">Sign Out</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-accent">Sign In</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
