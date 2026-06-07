'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export type Profile = {
  id: string;
  role: 'buyer' | 'seller' | string;
  name?: string | null;
  is_verified?: boolean | null;
  is_admin?: boolean | null;
  banned_at?: string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  [key: string]: any;
} | null;

type AuthState = {
  user: User | null;
  profile: Profile;
  supabase: SupabaseClient;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: Profile;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile>(initialProfile);

  // Keep local state in sync when the server re-renders the layout with a
  // different user (e.g. login redirect). React.Object.is skips the update
  // when references are equal, so this is cheap.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setUser(initialUser);
    setProfile(initialProfile);
  }, [initialUser, initialProfile]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
      // INITIAL_SESSION fires once on mount; skip because we already have server state.
      if (event === 'INITIAL_SESSION') return;

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        return;
      }

      const { data: row } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', nextUser.id)
        .maybeSingle();

      // Same fallback as the server layout: if the row didn't load, derive the
      // role from auth metadata rather than dropping to a null/buyer state.
      setProfile(
        (row as Profile) ?? {
          id: nextUser.id,
          role: (nextUser.user_metadata?.role as string) || 'buyer',
          name: (nextUser.user_metadata?.name as string) ?? null,
        }
      );
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthState>(
    () => ({ user, profile, supabase }),
    [user, profile, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
