import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createSaleSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export type DateFilter = "all" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

export function useSales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const buildStatsUrl = () => {
    const params = new URLSearchParams();
    if (dateFilter !== "all") {
      params.append("filter", dateFilter);
      if (dateFilter === "custom" && customDateRange?.from && customDateRange?.to) {
        params.append("from", customDateRange.from.toISOString());
        params.append("to", customDateRange.to.toISOString());
      }
    }
    const query = params.toString();
    return `${api.stats.get.path}${query ? `?${query}` : ''}`;
  };

  const { data: sales, isLoading: isSalesLoading } = useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const res = await fetch(api.sales.list.path, { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to fetch sales (${res.status})`);
      }
      return api.sales.list.responses[200].parse(await res.json());
    },
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: [api.stats.get.path, dateFilter, customDateRange],
    queryFn: async () => {
      const res = await fetch(buildStatsUrl(), { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to fetch stats (${res.status})`);
      }
      return api.stats.get.responses[200].parse(await res.json());
    },
  });

  const isLoading = isSalesLoading || isStatsLoading;

  const createSale = useMutation({
    mutationFn: async (data: z.infer<typeof createSaleSchema>) => {
      const res = await fetch(api.sales.create.path, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to create sale (${res.status})`);
      }
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

  return { sales, stats, isLoading, createSale, dateFilter, setDateFilter, customDateRange, setCustomDateRange };
}
