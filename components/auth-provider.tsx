"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: any; // Đã có role, avatar_url, v.v...
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Lấy user & profile
  useEffect(() => {
    let ignore = false;
    const getUser = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getUser();
      let profile = null;
      if (data?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        profile = profileData;
      }
      if (!ignore) {
        setUser(data?.user ? { ...data.user, ...profile } : null);
        setIsAuthenticated(!!data?.user);
        setIsLoading(false);
      }
    };
    getUser();

    // Lắng nghe login/logout, tự update lại user+profile
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setUser({ ...session.user, ...profileData });
        } else {
          setUser(null);
        }
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && pathname !== "/login" && pathname !== "/test-supabase") {
      router.push("/login");
    } else if (isAuthenticated && pathname === "/login") {
      router.push("/");
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
