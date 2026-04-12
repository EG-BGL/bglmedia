import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ClipboardList, Shield, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import bglLogo from '@/assets/bgl-logo.jpeg';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Fixtures & Results', path: '/fixtures' },
  { label: 'Ladder', path: '/ladder' },
  { label: 'Clubs', path: '/clubs' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); setNotifOpen(false); }, [location.pathname]);

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
            <div className="flex items-center gap-1 relative">
              {/* Notification Bell */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" title="Notifications" onClick={() => setNotifOpen(!notifOpen)}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                      <span className="text-sm font-bold">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={() => markAllRead.mutate()} className="text-xs text-primary font-semibold hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                      ) : (
                        notifications.slice(0, 10).map((n: any) => (
                          <button
                            key={n.id}
                            className={`w-full text-left px-4 py-3 hover:bg-muted/60 border-b border-border/50 last:border-0 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                            onClick={() => {
                              markAsRead.mutate(n.id);
                              setNotifOpen(false);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Mobile menu - condensed */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-card animate-in slide-in-from-top-1 duration-150">
          <nav className="page-container py-1.5">
            {user ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                {(role === 'coach' || role === 'league_admin') && (
                  <Link to="/portal" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-foreground text-xs font-semibold">
                    <ClipboardList className="h-3.5 w-3.5 opacity-70" /> Dashboard
                  </Link>
                )}
                {role === 'league_admin' && (
                  <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-foreground text-xs font-semibold">
                    <Shield className="h-3.5 w-3.5 opacity-70" /> Admin
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-foreground text-xs font-semibold">
                  <Settings className="h-3.5 w-3.5 opacity-70" /> Settings
                </Link>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                <User className="h-3.5 w-3.5" /> Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
