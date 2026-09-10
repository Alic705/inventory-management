import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  LogOut,
  Leaf,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet, SheetContent } from "./ui/sheet";
import { useSidebar } from "./ui/sidebar";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile } = useSidebar();

  const links = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard },
    { href: "/pos", label: t.pos, icon: Store },
    { href: "/products", label: t.products, icon: Package },
    { href: "/purchases", label: t.purchases, icon: ShoppingCart },
    { href: "/expenses", label: t.expenses, icon: Receipt },
    { href: "/reports", label: t.reports, icon: BarChart3 },
  ];

  if (user?.role === "admin") {
    links.splice(5, 0, { href: "/clients", label: t.clients, icon: Building2 });
    links.splice(6, 0, { href: "/users", label: t.users, icon: Users });
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-card p-4">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-green-600 text-white shadow-lg shadow-primary/20">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-primary">{t.marketManager}</h1>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={handleLinkClick}>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:pl-5"
                  )}
                >
                  <link.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                  {link.label}
                </button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-semibold text-sm">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role === 'admin' ? t.admin : t.staff}</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/50"
          onClick={() => {
            logout();
            if (isMobile) setOpenMobile(false);
          }}
        >
          <LogOut className="h-4 w-4" />
          {t.logout}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-[280px] p-0 bg-card border-r">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex h-screen flex-col justify-between border-r bg-card w-64 p-4 shadow-xl shadow-black/5 z-20">
      <SidebarContent />
    </div>
  );
}
