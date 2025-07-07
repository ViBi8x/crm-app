"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: any; // Bạn có thể định nghĩa lại type cho user nếu cần
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

  // Lấy trạng thái user hiện tại
  useEffect(() => {
    let ignore = false;
    const getUser = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (!ignore) {
        setUser(data?.user || null);
        setIsAuthenticated(!!data?.user);
        setIsLoading(false);
      }
    };
    getUser();

    // Lắng nghe sự kiện login/logout của supabase
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Tự động redirect khi chưa đăng nhập hoặc đã đăng nhập
  useEffect(() => {
    if (isLoading) return;

    // Cho phép truy cập trang test-supabase mà không cần đăng nhập
    if (!isAuthenticated && pathname !== "/login" && pathname !== "/test-supabase") {
      router.push("/login");
    } else if (isAuthenticated && pathname === "/login") {
      router.push("/");
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  // Đăng xuất thật
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Fix hydration warning: chỉ render UI sau khi đã xác định trạng thái
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
