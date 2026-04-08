import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type SportContextType = {
  sports: Sport[];
  currentSport: Sport | null;
  setSport: (slug: string) => void;
  isLoading: boolean;
};

const SportContext = createContext<SportContextType>({
  sports: [],
  currentSport: null,
  setSport: () => {},
  isLoading: true,
});

export function SportProvider({ children }: { children: ReactNode }) {
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    return localStorage.getItem('selected-sport') || 'afl';
  });

  const { data: sports = [], isLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sports').select('*').order('name');
      if (error) throw error;
      return data as Sport[];
    },
  });

  const currentSport = sports.find(s => s.slug === selectedSlug) || sports[0] || null;

  const setSport = (slug: string) => {
    setSelectedSlug(slug);
    localStorage.setItem('selected-sport', slug);
  };

  return (
    <SportContext.Provider value={{ sports, currentSport, setSport, isLoading }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport() {
  return useContext(SportContext);
}
