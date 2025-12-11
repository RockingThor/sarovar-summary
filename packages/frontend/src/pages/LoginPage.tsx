import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resetPassword } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Invalid email or password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);

    try {
      await resetPassword(resetEmail.trim());
      setResetSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send reset email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setResetEmail(email); // Pre-fill with login email if available
    setResetSent(false);
    setShowForgotPassword(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSent(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/sarovar-logo.png"
              alt="Sarovar Hotels"
              className="h-12 w-auto"
            />
            <span className="text-2xl font-display font-bold text-white">
              Sarovar Preopening Checklist
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-display font-bold text-white leading-tight">
            Hotel Pre-Opening
            <br />
            Progress Tracker
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Track and manage your hotel onboarding checklist with ease. Monitor
            progress across all departments in real-time.
          </p>

          <div className="space-y-4">
            {[
              "80+ Pre-opening checklist items",
              "Department-wise progress tracking",
              "Real-time status updates",
              "Complete audit trail",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white/90 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          © 2024 Sarovar Hotels. All rights reserved.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <img
                src="/sarovar-logo.png"
                alt="Sarovar Hotels"
                className="h-10 w-auto"
              />
              <span className="text-xl font-display font-bold">
                Sarovar Preopening Checklist
              </span>
            </div>
            <CardTitle className="text-2xl font-display">
              Welcome back
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>First time? Contact your admin to get your credentials.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Mail className="h-5 w-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {resetSent
                ? "Check your email for the password reset link."
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-emerald-100 p-3 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Email Sent!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-foreground">
                    {resetEmail}
                  </span>
                  . Please check your inbox.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleCloseForgotPassword} className="w-full">
                  Back to Login
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setResetSent(false)}
                  className="w-full text-muted-foreground"
                >
                  Didn't receive it? Try again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={resetLoading}
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForgotPassword}
                  disabled={resetLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
