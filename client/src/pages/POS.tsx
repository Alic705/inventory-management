import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { useI18n } from "@/lib/i18n";
import { getCategoryName } from "@/lib/productNames";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartItemWithDiscount extends CartItem {
  discount?: number;
}

export default function POS() {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { createSale } = useSales();
  const { t, language } = useI18n();
  const isMobile = useIsMobile();
  const [cart, setCart] = useState<CartItemWithDiscount[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [editingQty, setEditingQty] = useState<{ productId: number; value: string } | null>(null);

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
      return [...prev, { product, quantity: qty, discount: 0 }];
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
    setEditingQty(null);
  };

  const updateQtyManual = (productId: number, value: string) => {
    setEditingQty({ productId, value });
  };

  const applyManualQty = (productId: number) => {
    if (editingQty && editingQty.productId === productId) {
      const qty = parseFloat(editingQty.value) || 0;
      updateQty(productId, qty);
    }
  };

  const updateDiscount = (productId: number, discountValue: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, discount: Math.max(0, Math.min(discountValue, 100)) } : item
    ));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    // Calculate discounted rates for items
    // Apply both item-level discount and cart-level discount
    const itemsWithDiscount = cart.map(item => {
      const baseRate = item.product.saleRate;
      const itemDiscountPercent = item.discount || 0;
      // Apply item discount first
      let discountedRate = baseRate * (1 - itemDiscountPercent / 100);
      // Apply cart-level discount on top
      discountedRate = discountedRate * (1 - discount / 100);
      
      return {
        productId: item.product.id,
        quantity: item.quantity,
        rate: Math.round(discountedRate)
      };
    });

    createSale.mutate({
      items: itemsWithDiscount
    }, {
      onSuccess: () => {
        setCart([]);
        setDiscount(0);
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

  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.product.saleRate * item.quantity;
    const itemDiscount = item.discount || 0;
    return sum + (itemTotal * (1 - itemDiscount / 100));
  }, 0);
  const totalDiscountAmount = (subtotal * discount) / 100;
  const total = subtotal - totalDiscountAmount;

  const CartContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50 min-h-[200px]">
            <ShoppingCart className="h-16 w-16" />
            <p>{t.cartEmpty}</p>
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
                <div className="flex items-center gap-2 mt-1">
                  <button
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, item.quantity - 0.25); }}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  {editingQty?.productId === item.product.id ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editingQty.value}
                      onChange={(e) => updateQtyManual(item.product.id, e.target.value)}
                      onBlur={() => applyManualQty(item.product.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyManualQty(item.product.id);
                        }
                      }}
                      className="h-7 w-16 text-sm text-center p-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm font-mono w-12 text-center cursor-pointer hover:bg-muted px-1 rounded"
                      onClick={() => setEditingQty({ productId: item.product.id, value: String(item.quantity) })}
                    >
                      {item.quantity} {item.product.unit}
                    </span>
                  )}
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
          <span>{t.subtotal}</span>
          <span className="font-mono">Rs {subtotal.toFixed(2)}</span>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{t.discount} (%)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiscount(0)}
              className="h-9"
            >
              {t.clear}
            </Button>
          </div>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{t.discount}</span>
            <span className="font-mono">- Rs {totalDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-primary">
          <span>{t.total}</span>
          <span className="font-mono">Rs {total.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-xl h-12 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setCart([])}
            disabled={cart.length === 0}
          >
            {t.clear}
          </Button>
          <Button
            className="rounded-xl h-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25"
            onClick={() => {
              handleCheckout();
              if (isMobile) setCartOpen(false);
            }}
            disabled={cart.length === 0 || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : t.checkout}
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
              <TabsTrigger value="all" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">{t.all}</TabsTrigger>
              <TabsTrigger value="sabzi" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">{getCategoryName("Sabzi", language)}</TabsTrigger>
              <TabsTrigger value="phal" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">{getCategoryName("Phal", language)}</TabsTrigger>
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
              [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 sm:h-40 rounded-xl bg-muted/50 animate-pulse" />)
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
                    <p className="text-muted-foreground text-xs sm:text-sm">{getCategoryName(product.category, language)}</p>
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
                {t.currentBill}
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
              {t.currentBill}
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
