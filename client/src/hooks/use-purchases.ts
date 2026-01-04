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
      const res = await fetch(api.purchases.list.path);
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return api.purchases.list.responses[200].parse(await res.json());
    },
  });

  const createPurchase = useMutation({
    mutationFn: async (data: z.infer<typeof api.purchases.create.input>) => {
      const res = await fetch(api.purchases.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create purchase");
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

  return { purchases, isLoading, createPurchase };
}
