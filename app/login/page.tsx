"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState(1);

  // Đăng nhập thật với Supabase
  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  // Đăng nhập với Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    setError("Email hoặc mật khẩu không đúng / Invalid email or password");
    setIsLoading(false);
    return;
  }

  toast.success("Đăng nhập thành công / Login successful!");

  // Lấy user id từ kết quả đăng nhập
  const userId = data.user.id;

  // Lấy thông tin profile từ bảng profiles (giả sử bạn có bảng này)
  let userProfile = null;
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (!profileError && profile) {
      userProfile = {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
      };
    } else {
      // Nếu không có profile riêng, fallback dùng data.user
      userProfile = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || ""
      };
    }
  } catch {
    // Lỗi không fetch được profile
    userProfile = {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || ""
    };
  }

  // Lưu vào localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(userProfile));
  }

  // Chuyển trang
  router.push("/dashboard");
  setIsLoading(false);
};


  // Quên mật khẩu với Supabase
  const handleForgotPassword = async () => {
    if (resetStep === 1) {
      if (!resetEmail) {
        toast.error("Vui lòng nhập địa chỉ email / Please enter your email address");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) {
        toast.error("Không gửi được liên kết đặt lại mật khẩu / Failed to send reset link");
        return;
      }
      setResetStep(2);
      toast.success("Liên kết đặt lại đã được gửi đến email của bạn / Reset link sent to your email");
    } else {
      setIsForgotPasswordOpen(false);
      setResetStep(1);
      setResetEmail("");
      toast.success("Hướng dẫn đặt lại mật khẩu đã được gửi / Password reset instructions sent");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold">
              C
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CRM System</h1>
          <p className="text-gray-600 mt-2">Hệ thống quản lý khách hàng</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
              <br />
              <span className="text-sm">Nhập thông tin đăng nhập để truy cập tài khoản</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                  <span className="block text-xs text-muted-foreground">Địa chỉ email</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                  <span className="block text-xs text-muted-foreground">Mật khẩu</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                        Forgot Password?
                        <span className="block text-xs text-muted-foreground">Quên mật khẩu?</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{resetStep === 1 ? "Reset Password" : "Check Your Email"}</DialogTitle>
                        <DialogDescription>
                          {resetStep === 1 ? (
                            <>
                              Enter your email address and we'll send you a link to reset your password
                              <br />
                              <span className="text-sm">
                                Nhập địa chỉ email và chúng tôi sẽ gửi liên kết đặt lại mật khẩu
                              </span>
                            </>
                          ) : (
                            <>
                              We've sent a password reset link to your email address
                              <br />
                              <span className="text-sm">
                                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến địa chỉ email của bạn
                              </span>
                            </>
                          )}
                        </DialogDescription>
                      </DialogHeader>
                      {resetStep === 1 ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="resetEmail">Email Address</Label>
                            <Input
                              id="resetEmail"
                              type="email"
                              placeholder="Enter your email..."
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Check your email and click the link to reset your password
                            <br />
                            Kiểm tra email và nhấp vào liên kết để đặt lại mật khẩu
                          </p>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsForgotPasswordOpen(false);
                            setResetStep(1);
                            setResetEmail("");
                          }}
                        >
                          Cancel / Hủy
                        </Button>
                        <Button onClick={handleForgotPassword}>
                          {resetStep === 1 ? "Send Reset Link / Gửi liên kết" : "Done / Hoàn thành"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in... / Đang đăng nhập..." : "Sign In / Đăng nhập"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            © 2024 CRM System. All rights reserved.
            <br />
            Bản quyền thuộc về Hệ thống CRM.
          </p>
        </div>
      </div>
    </div>
  );
}
