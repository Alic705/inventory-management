import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2 } from "lucide-react";
import heroImg from "@/assets/market.jpg"; // Placeholder for static image logic if needed

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-green-600 text-white shadow-xl shadow-primary/30 mb-4">
            <Leaf className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Sabzi Mandi Manager</h1>
          <p className="text-muted-foreground max-w-xs">
            Enter your credentials to access the market management system.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8 border-b border-border/50">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Use 'admin' / 'admin' for demo access.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl border-border bg-background focus:ring-primary/20 h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-border bg-background focus:ring-primary/20 h-12"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
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
