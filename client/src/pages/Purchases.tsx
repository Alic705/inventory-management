import { usePurchases } from "@/hooks/use-purchases";
import { useProducts } from "@/hooks/use-products";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";

const formSchema = api.purchases.create.input.extend({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().min(0.1, "Quantity required"),
  rate: z.coerce.number().min(1, "Rate required"),
  totalAmount: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Purchases() {
  const { purchases, isLoading, createPurchase } = usePurchases();
  const { products } = useProducts();
  const [open, setOpen] = useState(false);

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
    createPurchase.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Purchases</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Record new stock arrivals.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Purchase Stock</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  onValueChange={(val) => form.setValue("productId", Number(val))}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products?.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.productId && <p className="text-xs text-destructive">Required</p>}
              </div>

              <div className="space-y-2">
                <Label>Supplier (Optional)</Label>
                <Input {...form.register("supplier")} className="rounded-xl" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" step="0.1" {...form.register("quantity")} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Rate (Cost)</Label>
                  <Input type="number" {...form.register("rate")} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input type="number" {...form.register("totalAmount")} className="rounded-xl bg-muted" readOnly />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createPurchase.isPending} className="w-full sm:w-auto">
                  {createPurchase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Purchase
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
                <TableHead className="min-w-[100px]">Date</TableHead>
                <TableHead className="min-w-[120px]">Product</TableHead>
                <TableHead className="min-w-[100px]">Supplier</TableHead>
                <TableHead className="min-w-[80px]">Qty</TableHead>
                <TableHead className="min-w-[80px]">Rate</TableHead>
                <TableHead className="min-w-[100px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : (
                purchases?.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{p.product?.name || "Unknown Product"}</TableCell>
                    <TableCell>{p.supplier || '-'}</TableCell>
                    <TableCell>{p.quantity} {p.product?.unit || "Unknown Unit"}</TableCell>
                    <TableCell>Rs {p.rate}</TableCell>
                    <TableCell className="font-bold">Rs {p.totalAmount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
