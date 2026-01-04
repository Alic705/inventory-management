import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useI18n } from "@/lib/i18n";
import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const { t } = useI18n();
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
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">{t.products}</h2>
          <p className="text-muted-foreground">Manage your inventory and pricing.</p>
        </div>
        
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if(!v) {
             setEditingProduct(null);
             form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/25">
              <Plus className="mr-2 h-4 w-4" /> {t.add}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} className="rounded-xl" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    onValueChange={(val) => form.setValue("category", val as any)}
                    defaultValue={form.getValues("category")}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sabzi">Sabzi</SelectItem>
                      <SelectItem value="Phal">Phal</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
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
                  <Label>Purchase Rate</Label>
                  <Input type="number" {...form.register("purchaseRate")} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label>Sale Rate</Label>
                  <Input type="number" {...form.register("saleRate")} className="rounded-xl" />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Initial Stock</Label>
                  <Input type="number" step="0.1" {...form.register("stock")} className="rounded-xl" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.save}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search products..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 bg-transparent h-auto p-0 text-base"
        />
      </div>

      <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Purchase Rate</TableHead>
              <TableHead>Sale Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : filteredProducts?.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No products found</TableCell></TableRow>
            ) : (
              filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <span className={product.stock < 5 ? "text-destructive font-bold" : ""}>
                      {product.stock} {product.unit}
                    </span>
                  </TableCell>
                  <TableCell>Rs {product.purchaseRate}</TableCell>
                  <TableCell>Rs {product.saleRate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
  );
}
