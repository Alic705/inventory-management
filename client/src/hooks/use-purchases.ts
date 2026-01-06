import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function usePurchases() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchases, isLoading } = useQuery({
    queryKey: [api.purchases.list.path],
    queryFn: async () => {
      const res = await fetch(api.purchases.list.path, { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to fetch purchases (${res.status})`);
      }
      return api.purchases.list.responses[200].parse(await res.json());
    },
  });

  const createPurchase = useMutation({
    mutationFn: async (data: z.infer<typeof api.purchases.create.input>) => {
      const res = await fetch(api.purchases.create.path, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to create purchase (${res.status})`);
      }
      return api.purchases.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.purchases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] }); // Update stock
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Purchase recorded" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePurchase = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof api.purchases.update.input>) => {
      const res = await fetch(api.purchases.update.path.replace(':id', String(id)), {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to update purchase (${res.status})`);
      }
      return api.purchases.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.purchases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Purchase updated" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePurchase = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(api.purchases.delete.path.replace(':id', String(id)), {
        method: "DELETE",
        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to delete purchase (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.purchases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Success", description: "Purchase deleted" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return { purchases, isLoading, createPurchase, updatePurchase, deletePurchase };
}
