import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ClipboardList, Shield, BarChart3, Settings, Bell } from 'lucide-react';
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
                  <Link to="/coach-hub" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted font-medium text-sm">
                    <BarChart3 className="h-4 w-4 opacity-60" /> Coach Hub
                  </Link>
                )}
                {(role === 'coach' || role === 'league_admin') && (
                  <Link to="/portal" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted font-medium text-sm">
                    <ClipboardList className="h-4 w-4 opacity-60" /> Dashboard
                  </Link>
                )}
                {role === 'league_admin' && (
                  <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted font-medium text-sm">
                    <Shield className="h-4 w-4 opacity-60" /> Admin Panel
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted font-medium text-sm">
                  <Settings className="h-4 w-4 opacity-60" /> Account Settings
                </Link>
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
