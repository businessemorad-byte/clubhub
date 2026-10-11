"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Profile, isExecutive as checkIsExec } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isExecutive: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isExecutive: false,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [loading, setLoading] = useState<boolean>(!initialUser);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // If not provided initially, fetch current user
    if (!initialUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        if (user) {
          fetchProfile(user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isExecutive = checkIsExec(profile?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isExecutive,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
