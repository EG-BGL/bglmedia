import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole } from '@/lib/supabase-helpers';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; facebook_name?: string; birth_year?: number; gamertag?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            // Check if user is banned
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_banned')
              .eq('id', session.user.id)
              .maybeSingle();
            if (profile?.is_banned) {
              await supabase.auth.signOut();
              setRole(null);
              setLoading(false);
              return;
            }
            const { data } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id);
            const roles = (data ?? []).map((d: any) => d.role);
            const priority: AppRole[] = ['league_admin', 'club_admin', 'coach', 'public'];
            const topRole = priority.find(r => roles.includes(r)) ?? null;
            setRole(topRole);
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile?.is_banned) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .then(({ data }) => {
            const roles = (data ?? []).map((d: any) => d.role);
            const priority: AppRole[] = ['league_admin', 'club_admin', 'coach', 'public'];
            const topRole = priority.find(r => roles.includes(r)) ?? null;
            setRole(topRole);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; facebook_name?: string; birth_year?: number; gamertag?: string }) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata ? { full_name: `${metadata.first_name ?? ''} ${metadata.last_name ?? ''}`.trim(), ...metadata } : undefined,
      }
    });
    // Update profile with extra fields after signup
    if (!error && data?.user && metadata) {
      await supabase.from('profiles').update({
        full_name: `${metadata.first_name ?? ''} ${metadata.last_name ?? ''}`.trim(),
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        facebook_name: metadata.facebook_name,
        birth_year: metadata.birth_year,
        gamertag: metadata.gamertag,
      } as any).eq('id', data.user.id);
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
