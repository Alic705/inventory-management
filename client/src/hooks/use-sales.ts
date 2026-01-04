import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createSaleSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useSales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sales, isLoading } = useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const res = await fetch(api.sales.list.path);
      if (!res.ok) throw new Error("Failed to fetch sales");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });

  const { data: stats } = useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
  });

  const createSale = useMutation({
    mutationFn: async (data: z.infer<typeof createSaleSchema>) => {
      const res = await fetch(api.sales.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sale");
      return api.sales.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] }); // Update stock
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] }); // Update dashboard
      toast({ title: "Success", description: "Sale completed!" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return { sales, stats, isLoading, createSale };
}
