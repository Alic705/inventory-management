import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Products from "@/pages/Products";
import Purchases from "@/pages/Purchases";
import Expenses from "@/pages/Expenses";
import Users from "@/pages/Users";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background w-full">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/20 relative">
          {isMobile && (
            <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
              <SidebarTrigger />
              <LanguageSwitcher />
            </div>
          )}
          {!isMobile && (
            <div className="absolute top-4 right-4 z-10">
              <LanguageSwitcher />
            </div>
          )}
          <Component />
        </main>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Protected Routes */}
      <Route path="/">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/pos">
        <PrivateRoute component={POS} />
      </Route>
      <Route path="/products">
        <PrivateRoute component={Products} />
      </Route>
      <Route path="/purchases">
        <PrivateRoute component={Purchases} />
      </Route>
      <Route path="/expenses">
        <PrivateRoute component={Expenses} />
      </Route>
      <Route path="/users">
        <PrivateRoute component={Users} />
      </Route>
      <Route path="/reports">
        <PrivateRoute component={Dashboard} /> {/* Reusing Dashboard for now */}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
