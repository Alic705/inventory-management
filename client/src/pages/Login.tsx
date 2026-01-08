import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4 sm:p-6 md:p-8 relative">
      <div className="absolute top-0 right-6 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-4 sm:space-y-5">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-green-600 text-white shadow-xl shadow-primary/30 mb-3 sm:mb-4">
            <Leaf className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground ">Inventory & Sales Management Software</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xs px-2">
            Enter your credentials to access the market management system.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3 sm:pb-4 pt-3 sm:pt-4 border-b border-border/50">
            <CardTitle className="text-xl sm:text-2xl text-center">{t.signIn}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 sm:pt-8 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base">{t.username}</Label>
                <Input
                  id="username"
                  placeholder={t.enterUsername}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl border-border bg-background focus:ring-primary/20 h-11 sm:h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.enterPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-border bg-background focus:ring-primary/20 h-11 sm:h-12"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />
    </div>
  );
}
