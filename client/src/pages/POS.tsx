import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { useClients } from "@/hooks/use-clients";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/hooks/use-translate";
import { getCategoryName } from "@/lib/productNames";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, User, Tag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useToast } from "@/hooks/use-toast";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartItemWithDiscount extends CartItem {
  discount?: number;
  customRate?: number; // Custom rate entered for this sale/customer
}

export default function POS() {
  const { toast } = useToast();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { createSale } = useSales();
  const { clients } = useClients();
  const { t, language } = useI18n();

  const { translateProductName, translateCategory } = useTranslate();
  const isMobile = useIsMobile();
  const [cart, setCart] = useState<CartItemWithDiscount[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("walk-in");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);

  const addToCart = (product: Product, qty: number = 1) => {
    const existing = cart.find(item => item.product.id === product.id);
    const newQty = (existing ? existing.quantity : 0) + qty;
    if (newQty > product.stock) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Cannot add more "${product.name}". Available stock is only ${product.stock} ${product.unit}.`,
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { product, quantity: qty, discount: 0, customRate: product.saleRate }];
    });
    if (isMobile) setCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) return removeFromCart(productId);
    const item = cart.find(i => i.product.id === productId);
    if (item && qty > item.product.stock) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Only ${item.product.stock} ${item.product.unit} available in stock for "${item.product.name}".`,
        variant: "destructive",
      });
      return;
    }
    setCart(prev => prev.map(i =>
      i.product.id === productId ? { ...i, quantity: qty } : i
    ));
  };

  const updateRate = (productId: string, newRate: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, customRate: Math.max(0, newRate) } : item
    ));
  };

  const updateDiscount = (productId: string, discountValue: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, discount: Math.max(0, Math.min(discountValue, 100)) } : item
    ));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Validate stock before checkout
    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Cannot sell ${item.quantity} ${item.product.unit} of "${item.product.name}". Only ${item.product.stock} ${item.product.unit} available!`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    // Calculate discounted rates for items using each item's custom price
    const itemsWithDiscount = cart.map(item => {
      const baseRate = item.customRate !== undefined ? Number(item.customRate) : (Number(item.product.saleRate) || 0);
      const itemDiscountPercent = Number(item.discount) || 0;
      let discountedRate = baseRate * (1 - itemDiscountPercent / 100);
      discountedRate = discountedRate * (1 - discount / 100);
      const roundedRate = Math.max(0, Math.round(discountedRate));
      const amount = Math.round(roundedRate * Number(item.quantity));

      const prodId = item.product.id || (item.product as any)._id;

      return {
        productId: String(prodId),
        quantity: Number(item.quantity),
        rate: roundedRate,
        amount: amount,
      };
    });

    createSale.mutate({
      items: itemsWithDiscount,
      clientId: (selectedClientId !== "walk-in" && selectedClientId) ? String(selectedClientId) : null
    }, {
      onSuccess: () => {
        setCart([]);
        setDiscount(0);
        setSelectedClientId("walk-in");
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
    const itemRate = item.customRate !== undefined ? item.customRate : item.product.saleRate;
    const itemTotal = itemRate * item.quantity;
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
          cart.map((item) => {
            const currentRate = item.customRate !== undefined ? item.customRate : item.product.saleRate;
            const itemTotal = currentRate * item.quantity;

            return (
              <div key={item.product.id} className="p-3 rounded-xl bg-background border border-border/60 shadow-sm space-y-2.5">
                {/* Header: Product Name + Total Price + Delete Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {translateProductName(item.product.name)}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      {translateCategory(item.product.category)} ({item.product.unit})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono font-bold text-sm text-primary">
                      Rs {Math.round(itemTotal).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Controls Row: Rate Input + Quantity Selector */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 items-center">
                  {/* Editable Rate (Price per unit) */}
                  <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border/40">
                    <span className="text-[11px] font-semibold text-muted-foreground">Rs</span>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={currentRate}
                      onChange={(e) => updateRate(item.product.id, e.target.value === "" ? 0 : Number(e.target.value))}
                      className="h-6 w-full text-xs font-mono font-bold p-0 border-0 bg-transparent focus-visible:ring-0 text-foreground"
                      title="Edit selling price for this customer"
                    />
                    <span className="text-[10px] text-muted-foreground">/{item.product.unit}</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      className="h-7 w-7 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      onClick={() => updateQty(item.product.id, Math.max(0.1, Number((item.quantity - 1).toFixed(2))))}
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <Input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => updateQty(item.product.id, e.target.value === "" ? 0 : Number(e.target.value))}
                      className="h-7 w-14 text-xs font-mono font-bold text-center p-0 rounded-lg bg-muted/40"
                    />

                    <button
                      className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex-shrink-0"
                      onClick={() => updateQty(item.product.id, Number((item.quantity + 1).toFixed(2)))}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 sm:p-6 border-t border-border/50 bg-muted/20 space-y-4">
        {/* Customer / Client Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold">{t.selectClient || "Select Customer / Khata"}</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder={t.walkInCustomer} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {t.walkInCustomer} (Cash Sale)
                </span>
              </SelectItem>
              {clients?.filter(c => c.type !== 'supplier').map((c) => {
                const bal = c.netBalance ?? 0;
                return (
                  <SelectItem key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                    {c.name} {c.company ? `(${c.company})` : ''} — {bal > 0 ? `Owes: Rs ${bal.toLocaleString()}` : 'Clear'}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center text-sm sm:text-base font-medium">
          <span className="text-muted-foreground">{t.subtotal}</span>
          <span className="font-mono font-bold text-foreground">Rs {subtotal.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <Label className="text-xs text-muted-foreground">{t.discount} (%)</Label>
            {discount > 0 && (
              <span className="font-mono font-semibold text-destructive">- Rs {totalDiscountAmount.toFixed(2)}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="h-9 rounded-xl font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiscount(0)}
              className="h-9 rounded-xl"
            >
              {t.clear}
            </Button>
          </div>
        </div>

        <Separator />
        <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-primary">
          <span>{t.total}</span>
          <span className="font-mono">Rs {Math.round(total).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-xl h-12 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
            onClick={() => setCart([])}
            disabled={cart.length === 0}
          >
            {t.clear}
          </Button>
          <Button
            className="rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 font-bold text-base"
            onClick={() => {
              handleCheckout();
              if (isMobile) setCartOpen(false);
            }}
            disabled={cart.length === 0 || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            {t.checkout}
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
              placeholder={t.search || "Search product name..."}
              className="pl-10 h-11 sm:h-12 rounded-xl bg-card border-border/50 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="h-11 sm:h-12 rounded-xl bg-card p-1 border border-border/50 shadow-sm w-full sm:w-auto">
              <TabsTrigger value="all" className="rounded-lg px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none">{t.all || "All"}</TabsTrigger>
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
              <span className="ml-2 font-mono">Rs {Math.round(total)}</span>
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
                      {product.stock <= 5 ? (
                        <span className="text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                          Low Stock: {product.stock}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary">
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {translateProductName(product.name)}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{getCategoryName(product.category, language)}</p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-lg sm:text-xl font-mono font-bold text-primary">
                        Rs {product.saleRate}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Default Rate</span>
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
          <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
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
        <Card className="w-[420px] flex flex-col rounded-2xl border-border/50 shadow-xl shadow-black/5 flex-shrink-0">
          <div className="p-5 border-b border-border/50 bg-muted/20">
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
