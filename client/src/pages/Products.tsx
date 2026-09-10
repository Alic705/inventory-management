import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useTranslate } from "@/hooks/use-translate";
import { useI18n } from "@/lib/i18n";
import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@shared/routes";

// Schema for form validation - coercing numbers
const formSchema = api.products.create.input.extend({
  purchaseRate: z.coerce.number().min(1, "Required"),
  saleRate: z.coerce.number().min(1, "Required"),
  stock: z.coerce.number().min(0, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Products() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { t, language } = useI18n();
  const { translateProductName, translateCategory } = useTranslate();
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Sabzi",
      unit: "kg",
      purchaseRate: 0,
      saleRate: 0,
      stock: 0,
      isActive: true,
    }
  });

  const onSubmit = (data: FormValues) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          setOpen(false);
          setEditingProduct(null);
          form.reset();
        }
      });
    } else {
      createProduct.mutate(data, {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      category: product.category as "Sabzi" | "Phal" | "Others",
      unit: product.unit as "kg" | "gram" | "dozen",
      purchaseRate: product.purchaseRate,
      saleRate: product.saleRate,
      stock: product.stock,
      isActive: product.isActive
    });
    setOpen(true);
  };

  const filteredProducts = products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{t.products}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t.manageInventory}</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingProduct(null);
            form.reset();
          }
        }}>
          <DialogContent className="w-[92vw] max-w-[550px] sm:max-w-[620px] rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t.editProduct}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t.leaveBlankToKeep || "Update product details"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label>{t.name}</Label>
                  <Input {...form.register("name")} className="rounded-xl" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t.category || "Category"}</Label>
                  <Select
                    onValueChange={(val) => form.setValue("category", val as any)}
                    defaultValue={form.getValues("category")}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sabzi">{translateCategory("Sabzi")}</SelectItem>
                      <SelectItem value="Phal">{translateCategory("Phal")}</SelectItem>
                      <SelectItem value="Others">{translateCategory("Others")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{(t as any).unit || "Unit"}</Label>
                  <Select
                    onValueChange={(val) => form.setValue("unit", val as any)}
                    defaultValue={form.getValues("unit")}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="gram">gram</SelectItem>
                      <SelectItem value="dozen">dozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.purchaseRate}</Label>
                  <Input type="number" onFocus={(e) => e.target.select()} {...form.register("purchaseRate")} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label>{t.saleRate}</Label>
                  <Input type="number" onFocus={(e) => e.target.select()} {...form.register("saleRate")} className="rounded-xl" />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label>{t.initialStock}</Label>
                  <Input type="number" step="0.1" onFocus={(e) => e.target.select()} {...form.register("stock")} className="rounded-xl" />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">{t.cancel}</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="w-full sm:w-auto">
                  {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.save}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 bg-card p-3 sm:p-4 rounded-xl border border-border/50 shadow-sm">
        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 text-sm sm:text-base"
        />
      </div>

      <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="min-w-[120px]">{t.name}</TableHead>
                <TableHead className="min-w-[100px]">{t.category || "Category"}</TableHead>
                <TableHead className="min-w-[100px]">{t.stock}</TableHead>
                <TableHead className="min-w-[110px]">{t.purchaseRate}</TableHead>
                <TableHead className="min-w-[100px]">{t.saleRate}</TableHead>
                <TableHead className={`min-w-[100px] ${language === 'ur' ? 'text-left' : 'text-right'}`}>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10">{t.loading}</TableCell></TableRow>
              ) : filteredProducts?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t.noProductsFound}</TableCell></TableRow>
              ) : (
                filteredProducts?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{translateProductName(product.name)}</TableCell>
                    <TableCell>{translateCategory(product.category)}</TableCell>
                    <TableCell>
                      <span className={product.stock < 5 ? "text-destructive font-bold" : ""}>
                        {product.stock} {product.unit}
                      </span>
                    </TableCell>
                    <TableCell>Rs {product.purchaseRate}</TableCell>
                    <TableCell>Rs {product.saleRate}</TableCell>
                    <TableCell className={language === 'ur' ? 'text-left' : 'text-right'}>
                      <div className={`flex ${language === 'ur' ? 'justify-start' : 'justify-end'} gap-2`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteProduct.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
