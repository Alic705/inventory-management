import { usePurchases } from "@/hooks/use-purchases";
import { useProducts } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { type Purchase } from "@shared/schema";

const formSchema = api.purchases.create.input.extend({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().min(0.1, "Quantity required"),
  rate: z.coerce.number().min(1, "Rate required"),
  totalAmount: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Purchases() {
  const { purchases, isLoading, createPurchase, updatePurchase, deletePurchase } = usePurchases();
  const { products } = useProducts();
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<(Purchase & { product: any }) | null>(null);
  const isAdmin = user?.role === 'admin';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      supplier: "",
      quantity: 0,
      rate: 0,
      totalAmount: 0,
    }
  });

  const quantity = form.watch("quantity");
  const rate = form.watch("rate");

  // Auto calculate total
  if (quantity && rate) {
    const total = quantity * rate;
    if (form.getValues("totalAmount") !== total) {
      form.setValue("totalAmount", total);
    }
  }

  const onSubmit = (data: FormValues) => {
    if (editingPurchase) {
      updatePurchase.mutate({ id: editingPurchase.id, ...data }, {
        onSuccess: () => {
          setOpen(false);
          setEditingPurchase(null);
          form.reset();
        }
      });
    } else {
      createPurchase.mutate(data, {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (purchase: Purchase & { product: any }) => {
    setEditingPurchase(purchase);
    form.reset({
      productId: purchase.productId,
      supplier: purchase.supplier || "",
      quantity: purchase.quantity,
      rate: purchase.rate,
      totalAmount: purchase.totalAmount,
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this purchase?")) {
      deletePurchase.mutate(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.purchases}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.recordNewStock}</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingPurchase(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t.newPurchase}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingPurchase ? t.edit : t.addPurchaseStock}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t.product}</Label>
                <Select
                  onValueChange={(val) => form.setValue("productId", Number(val))}
                  value={form.watch("productId") ? String(form.watch("productId")) : undefined}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={t.selectProduct} /></SelectTrigger>
                  <SelectContent>
                    {products?.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.productId && <p className="text-xs text-destructive">Required</p>}
              </div>

              <div className="space-y-2">
                <Label>{t.supplier} (Optional)</Label>
                <Input {...form.register("supplier")} className="rounded-xl" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.quantity}</Label>
                  <Input type="number" step="0.1" {...form.register("quantity")} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>{t.rate} ({t.cost})</Label>
                  <Input type="number" {...form.register("rate")} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.totalAmount}</Label>
                <Input type="number" {...form.register("totalAmount")} className="rounded-xl bg-muted" readOnly />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createPurchase.isPending || updatePurchase.isPending} className="w-full sm:w-auto">
                  {(createPurchase.isPending || updatePurchase.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.savePurchase}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="min-w-[100px]">{t.date}</TableHead>
                <TableHead className="min-w-[120px]">{t.product}</TableHead>
                <TableHead className="min-w-[100px]">{t.supplier}</TableHead>
                <TableHead className="min-w-[80px]">{t.qty}</TableHead>
                <TableHead className="min-w-[80px]">{t.rate}</TableHead>
                <TableHead className="min-w-[100px]">{t.total}</TableHead>
                {isAdmin && <TableHead className="min-w-[100px]">{t.actions}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">{t.loading}</TableCell></TableRow>
              ) : (
                purchases?.map(p => {
                  const product = products?.find(prod => prod.id === p.productId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-sm">{new Date(p.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{product?.name || t.unknownProduct}</TableCell>
                      <TableCell>{p.supplier || '-'}</TableCell>
                      <TableCell>{p.quantity} {product?.unit || t.unknownUnit}</TableCell>
                      <TableCell>Rs {p.rate}</TableCell>
                      <TableCell className="font-bold">Rs {p.totalAmount}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" />
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
      </Card>
    </div>
  );
}
