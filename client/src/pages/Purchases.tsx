import { usePurchases } from "@/hooks/use-purchases";
import { useProducts } from "@/hooks/use-products";
import { useClients } from "@/hooks/use-clients";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/hooks/use-translate";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ShoppingBag,
  Search,
  ArrowDownLeft,
  Boxes,
  Users,
  Calendar,
  Sparkles,
  PackagePlus,
  ListFilter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Purchase } from "@shared/schema";

export default function Purchases() {
  const { purchases, isLoading, createPurchase, updatePurchase, deletePurchase } = usePurchases();
  const { products, createProduct } = useProducts();
  const { clients } = useClients();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { translateProductName, translateCategory, translateCustom } = useTranslate();
  const { toast } = useToast();


  const [open, setOpen] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<"existing" | "new">("existing");
  const [editingPurchase, setEditingPurchase] = useState<(Purchase & { product: any }) | null>(null);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States for Existing Product
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [supplierName, setSupplierName] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");

  // Form States for Brand New Product
  const [newProdName, setNewProdName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<"Sabzi" | "Phal" | "Others">("Sabzi");
  const [newUnit, setNewUnit] = useState<"kg" | "gram" | "dozen">("kg");
  const [newSaleRate, setNewSaleRate] = useState<number | "">("");

  const isAdmin = user?.role === 'admin';

  // Computed total
  const computedTotal = (Number(quantity) || 0) * (Number(rate) || 0);

  // Reset form
  const resetForm = () => {
    setEditingPurchase(null);
    setSelectedProductId("");
    setSelectedClientId("none");
    setSupplierName("");
    setQuantity("");
    setRate("");
    setNewProdName("");
    setNewCategory("Sabzi");
    setNewUnit("kg");
    setNewSaleRate("");
    setPurchaseMode("existing");
    setIsSubmitting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products?.find(p => String(p.id || (p as any)._id) === prodId);
    if (prod && !rate) {
      setRate(prod.purchaseRate || 0);
    }
    if (prod && !newSaleRate) {
      setNewSaleRate(prod.saleRate || 0);
    }
  };

  const handleClientSelect = (cId: string) => {
    setSelectedClientId(cId);
    if (cId === "none") {
      setSupplierName("");
    } else {
      const client = clients?.find(c => String(c.id || (c as any)._id) === cId);
      if (client) {
        setSupplierName(client.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qtyNum = Number(quantity);
    const rateNum = Number(rate);

    if (!qtyNum || qtyNum <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid quantity greater than 0.", variant: "destructive" });
      return;
    }
    if (rateNum < 0 || isNaN(rateNum)) {
      toast({ title: "Validation Error", description: "Please enter a valid purchase rate.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let targetProductId = selectedProductId;

      // If adding a Brand New Product directly inside Purchases:
      if (purchaseMode === "new" && !editingPurchase) {
        if (!newProdName.trim()) {
          toast({ title: "Validation Error", description: "Please enter product name.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }

        const saleRateNum = Number(newSaleRate) > 0 ? Number(newSaleRate) : rateNum;

        // 1. Create the product first
        const createdProd = await createProduct.mutateAsync({
          name: newProdName.trim(),
          category: newCategory,
          unit: newUnit,
          purchaseRate: rateNum,
          saleRate: saleRateNum,
          stock: 0, // will be incremented by purchase
          isActive: true,
        });

        targetProductId = String(createdProd.id || (createdProd as any)._id);
      }

      if (!targetProductId) {
        toast({ title: "Validation Error", description: "Please select or create a product.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const totalAmount = qtyNum * rateNum;
      const cleanClientId = (selectedClientId === "none" || !selectedClientId) ? null : selectedClientId;

      const payload = {
        productId: targetProductId,
        clientId: cleanClientId,
        supplier: supplierName.trim() || undefined,
        quantity: qtyNum,
        rate: rateNum,
        totalAmount,
      };

      if (editingPurchase) {
        await updatePurchase.mutateAsync({ id: editingPurchase.id, ...payload });
        toast({ title: "Updated", description: "Purchase record updated successfully." });
      } else {
        await createPurchase.mutateAsync(payload);
        toast({
          title: "Purchase Recorded",
          description: purchaseMode === "new"
            ? `New product "${newProdName}" created and ${qtyNum} stock added!`
            : `Purchase of ${qtyNum} units recorded and stock updated!`
        });
      }

      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to record purchase.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (purchase: Purchase & { product: any }) => {
    setEditingPurchase(purchase);
    const prodId = purchase.productId?.id || purchase.productId?._id?.toString() || String(purchase.productId);
    const cId = purchase.clientId?.id || purchase.clientId?._id?.toString() || (purchase.clientId ? String(purchase.clientId) : "none");

    setSelectedProductId(prodId);
    setSelectedClientId(cId);
    setSupplierName(purchase.supplier || "");
    setQuantity(purchase.quantity);
    setRate(purchase.rate);
    setPurchaseMode("existing");
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.confirmDelete || "Are you sure you want to delete this purchase? This will revert inventory stock.")) {
      deletePurchase.mutate(id);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    if (!purchases) return { totalSpend: 0, totalQty: 0, totalCount: 0, suppliersCount: 0 };
    const totalSpend = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalQty = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const uniqueSuppliers = new Set(purchases.map(p => p.clientId?.name || p.supplier).filter(Boolean));

    return {
      totalSpend,
      totalQty,
      totalCount: purchases.length,
      suppliersCount: uniqueSuppliers.size,
    };
  }, [purchases]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    if (!search.trim()) return purchases;
    const q = search.toLowerCase();
    return purchases.filter((p) => {
      const prodName = (p.productId?.name || "").toLowerCase();
      const sup = (p.clientId?.name || p.supplier || "").toLowerCase();
      return prodName.includes(q) || sup.includes(q);
    });
  }, [purchases, search]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-auto  animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2.5">
            <Boxes className="h-8 w-8 text-primary" />
            {t.purchases}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            {language === 'ur'
              ? 'مال کی خریداری درج کریں — اسٹاک، ریٹ اور سپلائر کھاتہ خودکار اپڈیٹ ہوگا۔'
              : 'Record stock purchases — inventory stock, cost rates & supplier ledgers sync automatically.'}
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25 h-11 px-5 font-semibold">
              <Plus className="mr-2 h-5 w-5" /> {t.newPurchase}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92vw] max-w-[620px] sm:max-w-[680px] md:max-w-[720px] rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold flex items-center gap-2">
                <PackagePlus className="h-6 w-6 text-primary" />
                {editingPurchase ? t.edit : t.addPurchaseStock}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {language === 'ur'
                  ? 'موجودہ پروڈکٹ منتخب کریں یا براہ راست نئی پروڈکٹ ایڈ کریں۔'
                  : 'Select an existing item or create a brand new product directly here.'}
              </DialogDescription>
            </DialogHeader>

            {/* Mode Switcher Tabs (Only if not editing) */}
            {!editingPurchase && (
              <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => setPurchaseMode("existing")}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${purchaseMode === "existing"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {language === 'ur' ? 'موجودہ پروڈکٹ' : 'Existing Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseMode("new")}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${purchaseMode === "new"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Sparkles className="h-4 w-4" />
                  {language === 'ur' ? '➕ نئی پروڈکٹ' : '➕ Create New Product'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* === MODE 1: EXISTING PRODUCT === */}
              {purchaseMode === "existing" && (
                <div className="space-y-2">
                  <Label htmlFor="purchase-product" className="text-sm font-semibold">
                    {t.product} *
                  </Label>
                  <Select
                    onValueChange={handleProductSelect}
                    value={selectedProductId}
                  >
                    <SelectTrigger id="purchase-product" className="rounded-xl h-11">
                      <SelectValue placeholder={t.selectProduct || "Select Product from list..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id || (p as any)._id} value={String(p.id || (p as any)._id)}>
                          <span className="font-semibold">{translateProductName(p.name)}</span> ({p.unit}) — Stock: {p.stock} | Cost: Rs {p.purchaseRate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* === MODE 2: BRAND NEW PRODUCT DIRECT CREATION === */}
              {purchaseMode === "new" && !editingPurchase && (
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    {language === 'ur' ? 'نئی پروڈکٹ کی تفصیلات' : 'New Product Details'}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t.name} (Product Name) *</Label>
                    <Input
                      required
                      placeholder="e.g. Lahori Aloo, Irani Seb, Desi Kheera..."
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="rounded-xl h-10 bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{t.category || "Category"}</Label>
                      <Select
                        value={newCategory}
                        onValueChange={(val: any) => setNewCategory(val)}
                      >
                        <SelectTrigger className="rounded-xl h-10 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sabzi">{translateCategory("Sabzi")}</SelectItem>
                          <SelectItem value="Phal">{translateCategory("Phal")}</SelectItem>
                          <SelectItem value="Others">{translateCategory("Others")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{t.unit || "Unit"}</Label>
                      <Select
                        value={newUnit}
                        onValueChange={(val: any) => setNewUnit(val)}
                      >
                        <SelectTrigger className="rounded-xl h-10 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg (کلو)</SelectItem>
                          <SelectItem value="gram">gram (گرام)</SelectItem>
                          <SelectItem value="dozen">dozen (درجن)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t.saleRate || "Selling Price"} (Rs. for POS) *</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 120"
                      value={newSaleRate}
                      onChange={(e) => setNewSaleRate(e.target.value === "" ? "" : Number(e.target.value))}
                      className="rounded-xl h-10 bg-background font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'ur' ? 'یہ ریٹ POS کاؤنٹر پر گاہک کو فروخت کے وقت استعمال ہوگا۔' : 'This selling rate will be used when selling to customers at POS.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity & Purchase Cost Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="purchase-qty" className="text-sm font-semibold">
                    {t.quantity} ({purchaseMode === 'new' ? newUnit : 'Units'}) *
                  </Label>
                  <Input
                    id="purchase-qty"
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-xl h-11 font-mono text-base"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchase-rate" className="text-sm font-semibold">
                    {t.purchaseRate || "Purchase Cost"} (Rs.) *
                  </Label>
                  <Input
                    id="purchase-rate"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 80"
                    value={rate}
                    onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-xl h-11 font-mono text-base"
                    required
                  />
                </div>
              </div>

              {/* Supplier / Client selection */}
              <div className="space-y-2 pt-1 border-t border-border/60">
                <Label htmlFor="purchase-supplier" className="text-sm font-semibold">
                  {t.clients} / {t.supplier} (سپلائر کھاتہ)
                </Label>
                <Select
                  onValueChange={handleClientSelect}
                  value={selectedClientId}
                >
                  <SelectTrigger id="purchase-supplier" className="rounded-xl h-11">
                    <SelectValue placeholder="Select Registered Supplier / Khata..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Direct / Walk-in / Cash Mandi --</SelectItem>
                    {clients?.filter(c => c.type !== 'customer').map(c => {
                      const bal = c.netBalance ?? 0;
                      return (
                        <SelectItem key={c.id || (c as any)._id} value={String(c.id || (c as any)._id)}>
                          {c.name} {c.company ? `(${c.company})` : ''} — {bal < 0 ? `We Owe: Rs ${Math.abs(bal).toLocaleString()}` : `Balance: Rs ${bal.toLocaleString()}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Or type custom supplier / mandi seller name..."
                  className="rounded-xl h-10 mt-1"
                />
              </div>

              {/* Total Amount Card */}
              <div className="p-3.5 bg-muted/60 border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {t.totalAmount || "Total Purchase Cost"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {quantity || 0} × Rs {rate || 0}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-primary">
                  Rs {computedTotal.toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-xl h-11"
                  disabled={isSubmitting}
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl shadow-md shadow-primary/25 h-11 px-6 font-semibold"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {purchaseMode === "new" ? (language === 'ur' ? 'پروڈکٹ بنائیں اور اسٹاک ایڈ کریں' : 'Create & Record Purchase') : t.savePurchase}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'ur' ? 'کل خریداری لاگت' : 'Total Purchases'}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">
                Rs {kpis.totalSpend.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'ur' ? 'کل خریدی مقدار' : 'Total Units In'}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">
                {kpis.totalQty.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'ur' ? 'کل بل / انٹریز' : 'Total Entries'}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">
                {kpis.totalCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'ur' ? 'سپلائرز' : 'Suppliers'}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">
                {kpis.suppliersCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ur' ? 'پروڈکٹ یا سپلائر تلاش کریں...' : 'Search by product or supplier...'}
            className="pl-10 rounded-xl h-11 border-border/50 bg-card"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="min-w-[110px]">{t.date}</TableHead>
                  <TableHead className="min-w-[160px]">{t.product}</TableHead>
                  <TableHead className="min-w-[150px]">{t.supplier}</TableHead>
                  <TableHead className="min-w-[110px]">{t.qty}</TableHead>
                  <TableHead className="min-w-[110px]">{t.rate}</TableHead>
                  <TableHead className="min-w-[130px]">{t.total}</TableHead>
                  {isAdmin && <TableHead className="min-w-[100px] text-right">{t.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">{t.loading}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          {search ? "No purchases match your search." : "No stock purchases recorded yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((p) => {
                    const product = p.productId?.name ? p.productId : products?.find(prod => String(prod.id || (prod as any)._id) === String(p.productId));
                    return (
                      <TableRow key={p.id || (p as any)._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">
                          {new Date(p.date).toLocaleDateString("en-PK", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{product?.name ? translateProductName(product.name) : t.unknownProduct}</span>
                            {product?.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {translateCategory(product.category)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.clientId?.name ? (
                            <span className="font-medium text-foreground">{translateCustom(p.id, p.clientId.name)}</span>
                          ) : p.supplier ? (
                            translateCustom(p.id + '-sup', p.supplier)
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium text-foreground">
                          {p.quantity} {product?.unit || t.unknownUnit}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          Rs {p.rate}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-foreground">
                          Rs {p.totalAmount?.toLocaleString()}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                                onClick={() => handleEdit(p)}
                                title={t.edit}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(p.id || (p as any)._id)}
                                title={t.delete}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
