import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider, useI18n } from "@/lib/i18n";
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
import { useEffect } from "react";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { language } = useI18n();

  // Set RTL direction for Urdu
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (language === 'ur') {
      htmlElement.dir = 'rtl';
      htmlElement.lang = 'ur';
    } else {
      htmlElement.dir = 'ltr';
      htmlElement.lang = language === 'roman' ? 'en-PK' : 'en';
    }
  }, [language]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Use useEffect-like behavior to redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
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
            <div className={`absolute top-0 z-10 ${language === 'ur' ? 'left-6' : 'right-6'}`} >
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

      {/* Protected Routes - All require authentication */}
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
        <PrivateRoute component={Dashboard} /> {/* Reports page - can be enhanced later */}
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
