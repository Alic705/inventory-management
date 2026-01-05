import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { createSale } = useSales();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    if (isMobile) setCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    createSale.mutate({
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        rate: item.product.saleRate
      }))
    }, {
      onSuccess: () => {
        setCart([]);
        setIsSubmitting(false);
        if (isMobile) setCartOpen(false);
      },
      onError: () => setIsSubmitting(false)
    });
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && 
    (activeTab === "all" || p.category.toLowerCase() === activeTab.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + (item.product.saleRate * item.quantity), 0);

  const CartContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50 min-h-[200px]">
            <ShoppingCart className="h-16 w-16" />
            <p>Cart is empty</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {item.product.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between font-medium gap-2">
                  <span className="truncate">{item.product.name}</span>
                  <span className="font-mono flex-shrink-0">Rs {item.product.saleRate * item.quantity}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <button 
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, item.quantity - 0.25); }}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-mono w-12 text-center">{item.quantity} {item.product.unit}</span>
                  <button 
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, item.quantity + 0.25); }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item.product.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 sm:p-6 border-t border-border/50 bg-muted/20 space-y-4">
        <div className="flex justify-between items-center text-base sm:text-lg font-medium">
          <span>Subtotal</span>
          <span className="font-mono">Rs {total}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-primary">
          <span>Total</span>
          <span className="font-mono">Rs {total}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline" 
            className="rounded-xl h-12 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setCart([])}
            disabled={cart.length === 0}
          >
            Clear
          </Button>
          <Button 
            className="rounded-xl h-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25"
            onClick={() => {
              handleCheckout();
              if (isMobile) setCartOpen(false);
            }}
            disabled={cart.length === 0 || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Checkout"}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder={t.search} 
              className="pl-10 h-11 sm:h-12 rounded-xl bg-card border-border/50 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="h-11 sm:h-12 rounded-xl bg-card p-1 border border-border/50 shadow-sm w-full sm:w-auto">
              <TabsTrigger value="all" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">All</TabsTrigger>
              <TabsTrigger value="sabzi" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">Sabzi</TabsTrigger>
              <TabsTrigger value="phal" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">Phal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Cart Button */}
        {isMobile && (
          <Button 
            onClick={() => setCartOpen(true)}
            className="rounded-xl shadow-lg shadow-primary/25 relative"
            variant={cart.length > 0 ? "default" : "outline"}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Cart {cart.length > 0 && `(${cart.length})`}
            {cart.length > 0 && total > 0 && (
              <span className="ml-2 font-mono">Rs {total}</span>
            )}
          </Button>
        )}

        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-20">
            {isLoadingProducts ? (
              [1,2,3,4,5,6].map(i => <div key={i} className="h-32 sm:h-40 rounded-xl bg-muted/50 animate-pulse" />)
            ) : filteredProducts?.map((product) => (
              <Card 
                key={product.id} 
                className="group relative overflow-hidden rounded-2xl border-border/50 bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                onClick={() => addToCart(product)}
              >
                <div className="p-3 sm:p-4 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-1">
                      <span className="text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                        {product.unit}
                      </span>
                      {product.stock <= 5 && (
                        <span className="text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-red-100 text-red-600">
                          Low
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{product.category}</p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-end justify-between">
                    <div className="text-lg sm:text-xl font-mono font-bold text-primary">
                      Rs {product.saleRate}
                    </div>
                    <Button size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart - Desktop Sidebar / Mobile Sheet */}
      {isMobile ? (
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
            <SheetHeader className="p-4 sm:p-6 border-b border-border/50 bg-muted/20">
              <SheetTitle className="text-lg sm:text-xl font-display font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Current Bill
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col min-h-0">
              <CartContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Card className="w-[400px] flex flex-col rounded-2xl border-border/50 shadow-xl shadow-black/5 flex-shrink-0">
          <div className="p-6 border-b border-border/50 bg-muted/20">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Current Bill
            </h2>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <CartContent />
          </div>
        </Card>
      )}
    </div>
  );
}
